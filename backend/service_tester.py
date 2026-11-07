from parsers.wordle import WordleParser
from services.wordle_validation import validate_today_wordle

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