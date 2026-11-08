from sqlalchemy import Column, Integer, String, DateTime, Date, Text, Boolean, ForeignKey, JSON, func, UniqueConstraint
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(36), unique=True, nullable=False, index=True)
    username = Column(String(30), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    wallet_address = Column(String(44, collation="ascii_bin"), unique=True, nullable=False)

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    parser_key = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class Submission(Base):
    __tablename__ = "submissions"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "game_id",
            "puzzle_date",
            name="uq_user_game_puzzle"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    
    puzzle_date = Column(Date, nullable=False)
    raw_result = Column(Text, nullable=False)
    result_data = Column(JSON, nullable=False)
    reward_amount = Column(Integer, default=0, nullable=False)

    submitted_at = Column(DateTime, server_default=func.now(), nullable=False)

    payout_status = Column(String(20), nullable=False, default="not_requested")
    payout_signature = Column(String(100), nullable=True)
    payout_error = Column(Text, nullable=True)
    paid_at = Column(DateTime, nullable=True)

class WalletChallenge(Base):
    __tablename__ = "wallet_challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    wallet_address = Column(String(44), nullable=False)
    nonce = Column(String(64), unique=True, nullable=False)
    message = Column(Text, nullable=False)

    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)