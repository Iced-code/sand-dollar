import json
import os
from pathlib import Path

from dotenv import load_dotenv
from solders.keypair import Keypair

# Load the backend project's .env file.
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)


def get_treasury_keypair() -> Keypair:
    secret_key = os.getenv("SAND_TREASURY_SECRET_KEY")
    expected_address = os.getenv("SAND_TREASURY_ADDRESS")

    if not secret_key or not expected_address:
        raise RuntimeError("Treasury credentials are missing from .env.")

    try:
        secret_bytes = bytes(json.loads(secret_key))
        keypair = Keypair.from_bytes(secret_bytes)
    except (ValueError, TypeError, json.JSONDecodeError):
        raise RuntimeError("Invalid treasury secret key format.")

    # Verify that the private key matches the configured public address.
    actual_address = str(keypair.pubkey())

    if actual_address != expected_address:
        raise RuntimeError("Treasury keypair does not match the configured address.")

    return keypair


def get_solana_rpc_url() -> str:
    return os.getenv(
        "SOLANA_RPC_URL",
        "https://api.devnet.solana.com"
    )


def get_sand_mint_address() -> str:
    mint_address = os.getenv("SAND_MINT_ADDRESS")

    if not mint_address:
        raise RuntimeError("SAND_MINT_ADDRESS is missing from .env.")

    return mint_address