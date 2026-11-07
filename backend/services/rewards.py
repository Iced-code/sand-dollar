WORDLE_REWARDS = {
    1: 100,
    2: 80,
    3: 60,
    4: 40,
    5: 20,
    6: 10
}

CONNECTIONS_REWARDS = {
    0: 100,
    1: 80,
    2: 60,
    3: 40,
    4: 20,
}

def calculate_wordle_reward(result: dict) -> int:
    if not result["won"]:
        return 0

    return WORDLE_REWARDS.get(result["attempts"], 0)

def calculate_connections_reward(result: dict) -> int:
    if not result["won"]:
        return 0

    return CONNECTIONS_REWARDS.get(result["mistakes"], 0)