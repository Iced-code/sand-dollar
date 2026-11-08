from datetime import datetime, date
from pydantic import BaseModel, ConfigDict

class UserResponse(BaseModel):
    id: int
    public_id: str
    username: str
    created_at: datetime

    wallet_address: str | None = None

    model_config = ConfigDict(from_attributes=True)

class SubmissionCreate(BaseModel):
    raw_result: str

class SubmissionResponse(BaseModel):
    id: int
    puzzle_date: date
    result_data: dict
    reward_amount: int
    submitted_at: datetime

    payout_status: str
    payout_signature: str | None = None
    payout_error: str | None = None
    paid_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class WalletChallengeRequest(BaseModel):
    wallet_address: str

class WalletVerifyRequest(BaseModel):
    challenge_id: int
    wallet_address: str
    signature: str