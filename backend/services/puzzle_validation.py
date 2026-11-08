from datetime import datetime, date
from zoneinfo import ZoneInfo

import httpx

TIMEZONE = ZoneInfo("America/New_York")

CONNECTIONS_LAUNCH_DATE = date(2023, 6, 12)


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
        raise RuntimeError("Unable to verify today's Wordle puzzle. Please try again.") from exc

    expected = puzzle_data.get("days_since_launch")
    official_date = puzzle_data.get("print_date")

    if expected is None or official_date != today.isoformat():
        raise RuntimeError("Today's official Wordle puzzle is unavailable")

    if int(expected) != puzzle_number:
        # raise ValueError(f"Incorrect puzzle number. Today's Wordle puzzle number is #{expected}.")
        raise ValueError(f"Incorrect puzzle number.")

    return today

def validate_today_connections(puzzle_number: int):
    today = datetime.now(TIMEZONE).date()

    url = (
        f"https://www.nytimes.com/svc/connections/v2/{today.isoformat()}.json"
    )

    try:
        response = httpx.get(url, timeout=10)
        response.raise_for_status()
        puzzle_data = response.json()

    except (httpx.HTTPError, ValueError) as exc:
        raise RuntimeError("Unable to verify today's Connections puzzle. Please try again.") from exc

    official_date = puzzle_data.get("print_date")
    if puzzle_data.get("status") != "OK" or official_date != today.isoformat():
        raise RuntimeError("Today's official Connections puzzle is unavailable")

    expected = (today - CONNECTIONS_LAUNCH_DATE).days + 1   # puzzle number and id from endpoint are not the same. instead checks puzzle number with days since launch
    if expected != puzzle_number:
        # raise ValueError(f"Incorrect puzzle number. Today's Connection puzzle number is #{expected}.")
        raise ValueError(f"Incorrect puzzle number.")

    return today