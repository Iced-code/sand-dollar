import re

'''
Parses Connections share output 
example:

Connections
Puzzle #1245
🟨🟨🟨🟨
🟪🟦🟦🟪
🟪🟦🟩🟩
🟩🟦🟪🟦
🟩🟪🟩🟪
'''
class ConnectionsParser:
    TILE_PATTERN = re.compile(r"🟨|🟩|🟦|🟪")

    @staticmethod
    def parse(raw_text: str):
        lines = [
            line.strip().replace("\ufe0f", "")
            for line in raw_text.strip().splitlines()
            if line.strip()
        ]

        if not lines:
            raise ValueError("Empty Connections result")
        if len(lines) < 3:
            raise ValueError("Incomplete Connections result")

        # example: Wordle 1967 4/6
        header_pattern = r"Connections\s+Puzzle\s+#?(\d+)"
        header_text = " ".join(lines[:2])

        match = re.search(header_pattern, header_text, re.IGNORECASE)

        if not match:
            raise ValueError("Invalid Connections result header")

        puzzle_number = int(match.group(1))

        grid_lines = lines[2:]
        if len(grid_lines) < 0:
            raise ValueError("Connections result does not contain a result grid")

        # Connections does not explicitly give this info, so we have to determine it ourselves given the results. 
        solved_categories = 0
        mistakes = 0
        parsed_grid = []

        for row in grid_lines:
            tiles = ConnectionsParser.TILE_PATTERN.findall(row)

            if len(tiles) != 4:
                raise ValueError(f"Invalid Connections grid row: {repr(row)}")

            parsed_grid.append(tiles)

            if len(set(tiles)) == 1:    # converts row to a set to remove duplicate tiles. length of 1 means the category was solved
                solved_categories += 1
            else:
                mistakes += 1

        if solved_categories > 4:
            raise ValueError("Invalid number of solved categories")
        if mistakes > 4:
            raise ValueError("Too manu incorrect guesses")
        if solved_categories + mistakes != len(grid_lines):
            raise ValueError("Invalid Connections grid")

        return {
            "game": "Connections",
            "puzzle_number": puzzle_number,
            "total_guesses": len(grid_lines),
            "solved_categories": solved_categories,
            "mistakes": mistakes,
            "won": solved_categories == 4,
            "max_mistakes": 4,
            "grid": parsed_grid
        }