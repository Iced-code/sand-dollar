from parsers.wordle import WordleParser
from services.puzzle_validation import validate_today_wordle, validate_today_connections
from parsers.connections import ConnectionsParser
from services.rewards import calculate_connections_reward

sample = """Wordle 1,234 4/6

⬛🟨⬛⬛🟩
🟩🟩🟩🟩🟩
🟩🟩🟩🟩🟩
🟩🟩🟩🟩🟩
"""

result = WordleParser.parse(sample)
print(result)


try:
    today = validate_today_wordle(1967)
    print(f"success")
except Exception as e:
    print("fail")



sample_2 = """Connections
Puzzle #1245
🟨🟨🟨🟨
🟪🟦🟦🟪
🟩🟩🟦🟩
🟦🟦🟦🟦
🟩🟩🟩🟩
🟪🟪🟪🟪
"""

result = ConnectionsParser.parse(sample_2)
print(result)

reward = calculate_connections_reward(result=result)
print(reward)

try:
    today = validate_today_connections(1045)
    print(f"success")
except Exception as e:
    print("fail")



'''
$body = @{
    raw_result = @"
Connections
Puzzle #1245
🟨🟨🟨🟨
🟪🟦🟦🟪
🟩🟪🟦🟩
🟩🟩🟩🟩
🟦🟦🟦🟦
🟪🟪🟪🟪
"@
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://127.0.0.1:8000/games/connections/submit" `
    -Method Post `
    -Headers @{"X-User-ID" = "0b9de5fe-98cd-4160-b0c9-a191d8734115"} `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

'''


"""
Wordle 1,967 5/6
    
⬛🟨⬛⬛⬛
⬛🟨⬛⬛🟩
🟨🟩⬛⬛🟩
🟩🟩🟨⬛🟩
🟩🟩🟩🟩🟩
"""


"""Krillion #115 🦐
200

🐟🦑🫧🐟🐟🫧🐟



Krillion #115 🦐
200

🐟🦑🫧🫧🐟⬛🦑

https://krillion.io
"""

"""Hardle 
11/7/2026 | X/10
⬛⬛🟩⬛⬛ 0️⃣1️⃣
⬛⬛🟩⬛⬛ 0️⃣1️⃣
⬛⬛🟩⬛⬛ 0️⃣1️⃣
⬛⬛🟩⬛⬛ 0️⃣1️⃣
🟨⬛🟨⬛⬛ 2️⃣0️⃣
⬛⬛🟩⬛⬛ 0️⃣1️⃣
🟩⬛🟨⬛⬛ 1️⃣1️⃣
🟨⬛🟨⬛⬛ 2️⃣0️⃣
⬛🟨🟨⬛⬛ 2️⃣0️⃣
⬛🟨⬛⬛⬛ 1️⃣0️⃣
Play #hardle on hardle.org
"""