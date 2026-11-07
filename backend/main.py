from datetime import date
from uuid import UUID

from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from typing import List

from database import test_connection, Base, engine, get_db
from models import User, Game, Submission
from schemas import UserResponse, SubmissionCreate, SubmissionResponse
from parsers.wordle import WordleParser
from parsers.connections import ConnectionsParser
from services.rewards import calculate_wordle_reward, calculate_connections_reward
from services.puzzle_validation import validate_today_wordle, validate_today_connections

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

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