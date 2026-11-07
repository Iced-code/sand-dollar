from datetime import datetime, date
from pydantic import BaseModel, ConfigDict

class UserResponse(BaseModel):
    id: int
    public_id: str
    username: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SubmissionCreate(BaseModel):
    raw_result: str
    puzzle_date: date

class SubmissionResponse(BaseModel):
    id: int
    puzzle_date: date
    result_data: dict
    reward_amount: int
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)