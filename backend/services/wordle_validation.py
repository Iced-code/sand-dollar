from datetime import datetime
from zoneinfo import ZoneInfo

import httpx

TIMEZONE = ZoneInfo("America/New_York")

def validate_today_wordle(puzzle_number: int):
    today = datetime.now(TIMEZONE).date()

    url = (
        f"https://www.nytimes.com/svc/wordle/v2/{today.isoformat()}.json"
    )

    try:
        response = httpx.get(url, timeout=10)
        response.raise_for_status()
        puzzle_data = response.json()

    except (httpx.HTTPError, ValueError) as exc:
        raise RuntimeError("Unable to verify today's Wordle puzzle. Please try again.")

    expected = puzzle_data.get("days_since_launch")
    official_date = puzzle_data.get("print_date")

    if expected is None or official_date != today.isoformat():
        raise RuntimeError("Today's official Wordle puzzle is unavailable")

    if int(expected) != puzzle_number:
        raise ValueError(f"Incorrect puzzle number. Today's Wordle puzzle number is #{expected}.")

    return today