from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from typing import List

from database import test_connection, Base, engine, get_db
from models import User, Game, Submission, WalletChallenge
from schemas import UserResponse, SubmissionCreate, SubmissionResponse, WalletChallengeRequest, WalletVerifyRequest
from parsers.wordle import WordleParser
from parsers.connections import ConnectionsParser
from services.rewards import calculate_wordle_reward, calculate_connections_reward
from services.puzzle_validation import validate_today_wordle, validate_today_connections

import secrets
import base64, base58

from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

import asyncio
from decimal import Decimal
from services.sand_payout import transfer_sand

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


def process_submission_payout(
    db: Session,
    user: User,
    submission: Submission
):
    # No reward means no blockchain transaction is needed.
    if submission.reward_amount <= 0:
        submission.payout_status = "not_requested"
        db.commit()
        return

    # A wallet must be linked before sending a reward.
    if not user.wallet_address:
        submission.payout_status = "failed"
        submission.payout_error = "No wallet linked to this account."
        db.commit()
        return

    # Mark the payout as processing before attempting the transfer.
    submission.payout_status = "processing"
    submission.payout_error = None
    db.commit()

    try:
        result = asyncio.run(
            transfer_sand(
                recipient_address=user.wallet_address,
                amount=Decimal(str(submission.reward_amount))
            )
        )

        submission.payout_status = "paid"
        submission.payout_signature = result["signature"]
        submission.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)
        submission.payout_error = None

    except Exception as e:
        submission.payout_status = "failed"
        submission.payout_error = str(e)

    db.commit()


@app.get("/")
def root():
    return {
        "message": "Welcome to Sand Dollar",
        "status": "online"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/health/db")
def database_health():
    try:
        test_connection()
        return {
            "status": "connected",
            "database": "sand_dollar"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine) 

@app.get("/users/me", response_model=UserResponse)
def get_current_user(
    user_id: UUID = Header(..., alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    public_id = str(user_id)

    user = db.query(User).filter(
        User.public_id == public_id
    ).first()

    if user: return user

    # create user if user does not already exist
    new_user = User(
        public_id=public_id,
        username=f"Player-{public_id[:6]}"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/games/wordle/submit", response_model=SubmissionResponse)
def submit_wordle(submission: SubmissionCreate, user_id: UUID = Header(..., alias="X-User-ID"), db: Session = Depends(get_db)):

    # Find user
    user = db.query(User).filter(
        User.public_id == str(user_id)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find Wordle game
    game = db.query(Game).filter(
            Game.slug == "wordle",
            Game.is_active == True
        ).first()
    if not game:
        raise HTTPException(status_code=404, detail="Wordle is unavailable")

    # Parse pasted Wordle result
    try:
        result = WordleParser.parse(submission.raw_result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        official_date = validate_today_wordle(result["puzzle_number"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Check for an existing submission
    existing_game = db.query(Submission).filter(
        Submission.user_id == user.id,
        Submission.game_id == game.id,
        Submission.puzzle_date == official_date
    ).first()

    if existing_game:
        raise HTTPException(status_code=409, detail="You have already submitted this Wordle puzzle")

    reward = calculate_wordle_reward(result=result)

    new_submission = Submission(
        user_id=user.id,
        game_id=game.id,
        puzzle_date=official_date,
        raw_result=submission.raw_result,
        result_data=result,
        reward_amount=reward
    )

    try:
        db.add(new_submission)
        db.commit()
        db.refresh(new_submission)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already submitted this Wordle puzzle")

    process_submission_payout(db=db, user=user, submission=new_submission)
    db.refresh(new_submission)

    return new_submission

@app.post("/games/connections/submit", response_model=SubmissionResponse)
def submit_connections(submission: SubmissionCreate, user_id: UUID = Header(..., alias="X-User-ID"), db: Session = Depends(get_db)):

    # Find user
    user = db.query(User).filter(
        User.public_id == str(user_id)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find Connections game
    game = db.query(Game).filter(
            Game.slug == "connections",
            Game.is_active == True
        ).first()
    if not game:
        raise HTTPException(status_code=404, detail="Connections is unavailable")

    # Parse pasted Connections result
    try:
        result = ConnectionsParser.parse(submission.raw_result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        official_date = validate_today_connections(result["puzzle_number"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Check for an existing submission
    existing_game = db.query(Submission).filter(
        Submission.user_id == user.id,
        Submission.game_id == game.id,
        Submission.puzzle_date == official_date
    ).first()

    if existing_game:
        raise HTTPException(status_code=409, detail="You have already submitted this Connections puzzle")

    reward = calculate_connections_reward(result=result)

    new_submission = Submission(
        user_id=user.id,
        game_id=game.id,
        puzzle_date=official_date,
        raw_result=submission.raw_result,
        result_data=result,
        reward_amount=reward
    )

    try:
        db.add(new_submission)
        db.commit()
        db.refresh(new_submission)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already submitted this Connections puzzle")

    process_submission_payout(db=db, user=user, submission=new_submission)
    db.refresh(new_submission)

    return new_submission

@app.get("/users/me/balance")
def get_user_balance(user_id: UUID = Header(..., alias="X-User-ID"), db: Session = Depends(get_db)):
    user = db.query(User).filter(
            User.public_id == str(user_id)
        ).first()
    if not user:
            raise HTTPException(status_code=404, detail="User not found")

    balance = db.query(func.coalesce(func.sum(Submission.reward_amount), 0)).filter(Submission.user_id == user.id).scalar()

    return {
        "username": user.username,
        "balance": balance,
        "currency": "SAND"
    }

@app.get("/users/me/submissions", response_model=List[SubmissionResponse])
def get_user_submissions(user_id: UUID = Header(..., alias="X-User-ID"), db: Session = Depends(get_db)):
    user = db.query(User).filter(
            User.public_id == str(user_id)
        ).first()
    if not user:
            raise HTTPException(status_code=404, detail="User not found")

    submissions = db.query(Submission).filter(
                    Submission.user_id == user.id
                  ).order_by(Submission.submitted_at.desc()).all()
        
    return submissions

@app.post("/wallet/challenge")
def create_wallet_challenge(request: WalletChallengeRequest, user_id: UUID = Header(..., alias="X-User-ID"), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.public_id == str(user_id)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid_characters = ("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")

    address = request.wallet_address

    if not 32 <= len(address) <= 44 or not all(char in valid_characters for char in address):
        raise HTTPException(status_code=400, detail="Invalid Solana wallet address")

    wallet = db.query(User).filter(
        User.wallet_address == address
    ).first()

    if wallet and wallet.id != user.id:
        raise HTTPException(status_code=409, detail="This wallet is already linked to another account")
    if user.wallet_address and user.wallet_address != address:
            raise HTTPException(status_code=409, detail="This wallet is already linked to another account")

    nonce = secrets.token_urlsafe(32)

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expires_at = now + timedelta(minutes=5)

    message = (
        f"Sand Dollar Wallet Verification\n\n"
        f"Account: {user.public_id}\n"
        f"Wallet: {address}\n"
        f"Nonce: {nonce}\n"
        f"Expires: {expires_at.isoformat()} UTC\n\n"
        "Sign this message to link this wallet to your Sand Dollar account."
    )

    challenge = WalletChallenge(
        user_id=user.id,
        wallet_address=address,
        nonce=nonce,
        message=message,
        expires_at=expires_at
    )

    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    return {
        "challenge_id": challenge.id,
        "message": challenge.message,
        "expires_at": challenge.expires_at
    }

@app.post("/wallet/verify")
def verify_wallet(request: WalletVerifyRequest, user_id: UUID = Header(..., alias="X-User-ID"), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.public_id == str(user_id)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    challenge = db.query(WalletChallenge).filter(
        WalletChallenge.id == request.challenge_id,
        WalletChallenge.user_id == user.id,
        WalletChallenge.wallet_address == request.wallet_address,
    ).with_for_update().first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Wallet challenge not found")
    if challenge.used_at is not None:
        raise HTTPException(status_code=400, detail="Challenge has already been used")

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if challenge.expires_at <= now:
        raise HTTPException(status_code=400, detail="Challenge has expired")

    wallet = db.query(User).filter(
            User.wallet_address == request.wallet_address
        ).first()
    if wallet and wallet.id != user.id:
        raise HTTPException(status_code=409, detail="Wallet is already linked to another account")

    try:
        public_key = base58.b58decode(request.wallet_address)
        if len(public_key) != 32:
            raise ValueError("Invalid public key length")

        signature = base64.b64decode(request.signature, validate=True)
        if len(signature) != 64:
            raise ValueError("Invalid signature length")

        verify_key = VerifyKey(public_key)
        verify_key.verify(challenge.message.encode("utf-8"), signature)
    except (ValueError, BadSignatureError):
        raise HTTPException(status_code=400, detail="Invalid wallet signature")

    user.wallet_address = request.wallet_address

    challenge.used_at = now

    db.commit()

    return {
        "message": "Wallet successfully linked",
        "wallet_address": user.wallet_address
    }

@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):

    results = db.query(
        User.username,
        func.sum(Submission.reward_amount).label("total_earned"),
        func.count(Submission.id).label("payout_count")
    ).join(
        Submission,
        Submission.user_id == User.id
    ).filter(
        Submission.payout_status == "paid"
    ).group_by(
        User.id,
        User.username
    ).order_by(
        func.sum(Submission.reward_amount).desc()
    ).limit(10).all()

    return [
        {
            "rank": index + 1,
            "username": result.username,
            "total_earned": int(result.total_earned),
            "payout_count": result.payout_count
        }
        for index, result in enumerate(results)
    ]