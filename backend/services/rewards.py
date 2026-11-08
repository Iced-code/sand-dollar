WORDLE_REWARDS = {
    1: 1100,
    2: 1000,
    3: 800,
    4: 600,
    5: 400,
    6: 200
}

CONNECTIONS_REWARDS = {
    0: 1000,
    1: 800,
    2: 600,
    3: 400,
    4: 200,
}

def calculate_wordle_reward(result: dict) -> int:
    if not result["won"]:
        return 0

    return WORDLE_REWARDS.get(result["attempts"], 0)

def calculate_connections_reward(result: dict) -> int:
    if not result["won"]:
        return 0

    return CONNECTIONS_REWARDS.get(result["mistakes"], 0)