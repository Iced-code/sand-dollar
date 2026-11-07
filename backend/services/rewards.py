WORDLE_REWARDS = {
    1: 100,
    2: 80,
    3: 60,
    4: 40,
    5: 20,
    6: 10
}

def calculate_wordle_reward(result: dict) -> int:
    if not result["won"]:
        return 0

    return WORDLE_REWARDS.get(result["attempts"], 0)