from decimal import Decimal

from solana.rpc.async_api import AsyncClient
from solders.pubkey import Pubkey
from solders.message import MessageV0
from solders.transaction import VersionedTransaction

from spl.token.constants import (
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
)

from spl.token.instructions import (
    get_associated_token_address,
    transfer_checked,
    create_idempotent_associated_token_account
)

from spl.token.models import TransferCheckedParams

from services.solana_treasury import (
    get_treasury_keypair,
    get_solana_rpc_url,
    get_sand_mint_address
)


DECIMALS = 9


async def transfer_sand(recipient_address: str, amount: Decimal):
    treasury = get_treasury_keypair()
    recipient = Pubkey.from_string(recipient_address)
    mint = Pubkey.from_string(get_sand_mint_address())

    if amount <= 0:
        raise ValueError("Transfer amount must be positive.")

    raw_amount = int(amount * (10 ** DECIMALS))

    if Decimal(raw_amount) / (10 ** DECIMALS) != amount:
        raise ValueError("Amount exceeds SAND decimal precision.")

    treasury_address = treasury.pubkey()

    source = get_associated_token_address(
        treasury_address,
        mint
    )

    destination = get_associated_token_address(
        recipient,
        mint
    )

    async with AsyncClient(get_solana_rpc_url()) as client:
        treasury_info = await client.get_token_account_balance(source)
        available_balance = Decimal(
            treasury_info.value.ui_amount_string
        )
        if available_balance < amount:
            raise ValueError("Treasury has insufficient SAND.")

        instructions = []

        instructions.append(
            create_idempotent_associated_token_account(
                payer=treasury_address,
                owner=recipient,
                mint=mint,
            )
        )

        instructions.append(
            transfer_checked(
                TransferCheckedParams(
                    program_id=TOKEN_PROGRAM_ID,
                    source=source,
                    mint=mint,
                    dest=destination,
                    owner=treasury_address,
                    amount=raw_amount,
                    decimals=DECIMALS,
                )
            )
        )

        latest_blockhash = await client.get_latest_blockhash()

        message = MessageV0.try_compile(
            payer=treasury_address,
            instructions=instructions,
            address_lookup_table_accounts=[],
            recent_blockhash=latest_blockhash.value.blockhash,
        )

        transaction = VersionedTransaction(
            message,
            [treasury]
        )

        response = await client.send_transaction(transaction)

        signature = response.value

        confirmation = await client.confirm_transaction(
            signature,
            commitment="confirmed"
        )

        if confirmation.value[0].err is not None:
            raise RuntimeError(
                f"SAND transfer failed: {confirmation.value[0].err}"
            )

        return {
            "signature": str(signature),
            "amount": str(amount),
            "recipient": recipient_address,
        }