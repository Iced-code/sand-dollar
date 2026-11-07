import re

'''
Parses Wordle share output 
example:
Wordle 1,967 X/6

⬛🟩⬛⬛⬛
⬛🟩⬛⬛⬛
⬛🟩⬛⬛⬛
⬛🟩⬛⬛⬛
⬛🟩⬛⬛⬛
⬛🟩⬛⬛⬛
'''
class WordleParser:

    @staticmethod
    def parse(raw_text: str):
        lines = [
            line.strip()
            for line in raw_text.strip().splitlines()
            if line.strip()
        ]

        if not lines:
            raise ValueError("Empty Wordle result")

        lines = [
            line.replace("\ufe0f", "") for line in lines
        ]

        # example: Wordle 1967 4/6
        header_pattern = r"Wordle\s+#?([\d,]+)\s(\d|X)/6"

        match = re.search(header_pattern, lines[0], re.IGNORECASE)

        if not match:
            raise ValueError("Invalid Wordle result header")

        puzzle_number = int(match.group(1).replace(",", ""))
        attempts_text = match.group(2)

        won = attempts_text.upper != "X"
        attempts = int(attempts_text) if won else 6

        grid_lines = lines[1:]
        if not grid_lines:
            raise ValueError("Wordle result does not contain a result grid")

        if len(grid_lines) != attempts:
            raise ValueError("Number of grid rows does not match reported attemtps")

        valid_tiles = {"🟩", "🟨", "⬛", "⬜", "🟧"}

        for row in grid_lines:
            tiles = re.findall(r"🟩|🟨|⬛|⬜|🟧", row)

            if len(tiles) != 5:
                raise ValueError("Invalid Wordle grid row", f"Received: {repr(row)}", f"Recognized tiels: {len(tiles)}")
            if any(tile not in valid_tiles for tile in tiles):
                raise ValueError("Invalid World tile")

        return {
            "game": "Wordle",
            "puzzle_number": puzzle_number,
            "attempts": attempts,
            "won": won,
            "max_attempts": 6,
            "grid": grid_lines
        }