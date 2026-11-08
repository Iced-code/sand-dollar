from parsers.wordle import WordleParser
from services.puzzle_validation import validate_today_wordle, validate_today_connections
from parsers.connections import ConnectionsParser
from services.rewards import calculate_connections_reward
from services.solana_treasury import get_treasury_keypair, get_solana_rpc_url, get_sand_mint_address


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


keypair = get_treasury_keypair()

print(f"Treasure address: {keypair.pubkey()}")
print(f"RPC URL: {get_solana_rpc_url()}")
print(f"SAND mint: {get_sand_mint_address()}")




""" import asyncio
from decimal import Decimal

from solana.rpc.async_api import AsyncClient
from solana.rpc.models import TokenAccountOpts
from solders.pubkey import Pubkey

from services.solana_treasury import (
    get_solana_rpc_url,
    get_sand_mint_address
)

TREASURY_ADDRESS = "6VNR4x8AMkQJitJnEApK1aMwmCo9tjndbCpAtu2a6ZuV"


async def main():
    treasury = Pubkey.from_string(TREASURY_ADDRESS)
    mint = Pubkey.from_string(get_sand_mint_address())

    async with AsyncClient(get_solana_rpc_url()) as client:
        response = await client.get_token_accounts_by_owner_json_parsed(
            treasury,
            TokenAccountOpts(mint=mint)
        )

    total_balance = Decimal("0")

    for account in response.value:
        info = account.account.data.parsed["info"]
        amount = info["tokenAmount"]["uiAmountString"]
        total_balance += Decimal(amount)

    print("Treasury:", TREASURY_ADDRESS)
    print("SAND balance:", total_balance)


if __name__ == "__main__":
    asyncio.run(main()) """


# TESTS SAND PAYOUT PREFLIGHT
import asyncio
from decimal import Decimal

from solana.rpc.async_api import AsyncClient
from solders.pubkey import Pubkey
from spl.token.instructions import get_associated_token_address

from services.solana_treasury import (
    get_treasury_keypair,
    get_solana_rpc_url,
    get_sand_mint_address
)

TREASURY = "6VNR4x8AMkQJitJnEApK1aMwmCo9tjndbCpAtu2a6ZuV"
RECIPIENT = "6AVUdzEBu6CAEKRyxh7tu34ctZo6q98q5CJvPU6c96Z5"


async def main():
    treasury = Pubkey.from_string(TREASURY)
    recipient = Pubkey.from_string(RECIPIENT)
    mint = Pubkey.from_string(get_sand_mint_address())

    if treasury == recipient:
        raise ValueError("Treasury and recipient cannot be the same.")

    if get_treasury_keypair().pubkey() != treasury:
        raise ValueError("Treasury keypair mismatch.")

    source = get_associated_token_address(treasury, mint)
    destination = get_associated_token_address(recipient, mint)

    async with AsyncClient(get_solana_rpc_url()) as client:
        source_info = await client.get_token_account_balance(source)
        destination_info = await client.get_account_info(destination)

        source_balance = Decimal(
            source_info.value.ui_amount_string
        )

        destination_balance = Decimal("0")

        if destination_info.value is not None:
            result = await client.get_token_account_balance(destination)
            destination_balance = Decimal(
                result.value.ui_amount_string
            )

        sol_response = await client.get_balance(treasury)
        treasury_sol = sol_response.value / 1_000_000_000

    print("Treasury:", treasury)
    print("Recipient:", recipient)
    print("SAND mint:", mint)
    print("Treasury SAND:", source_balance)
    print("Recipient SAND:", destination_balance)
    print("Transfer amount: 1 SAND")
    print("Preflight complete. No transaction sent.")
    print("Treasury SOL:", treasury_sol)

if __name__ == "__main__":
    asyncio.run(main())


""" # TESTS SAND PAYOUT
import asyncio
from decimal import Decimal

from services.sand_payout import transfer_sand


RECIPIENT = "6AVUdzEBu6CAEKRyxh7tu34ctZo6q98q5CJvPU6c96Z5"


async def main():
    result = await transfer_sand(
        recipient_address=RECIPIENT,
        amount=Decimal("1")
    )

    print("Transfer successful!")
    print("Amount:", result["amount"], "SAND")
    print("Recipient:", result["recipient"])
    print("Transaction:", result["signature"])


if __name__ == "__main__":
    asyncio.run(main()) """


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


"""$headers = @{
    "X-User-ID" = "0b9de5fe-98cd-4160-b0c9-a191d8734115"
}

$body = @{
    wallet_address = "6AVUdzEBu6CAEKRyxh7tu34ctZo6q98q5CJvPU6c96Z5"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://127.0.0.1:8000/wallet/challenge" `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
"""