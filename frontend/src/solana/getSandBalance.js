
import {
    Connection,
    PublicKey,
    clusterApiUrl
} from "@solana/web3.js";

import {
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getAccount
} from "@solana/spl-token";

const connection = new Connection(
    clusterApiUrl("devnet"),
    "confirmed"
);

const SAND_MINT_ADDRESS =
    "DDrtiXyiqs4diFmqiACLfqtJd3LvSzEcnyMMFjYnz2zP";

export async function getSandBalance(walletAddress) {
    if (!walletAddress) {
        throw new Error("Wallet address is required.");
    }

    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(SAND_MINT_ADDRESS);

    const tokenAccount = await getAssociatedTokenAddress(
        mint,
        owner,
        false,
        TOKEN_PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(tokenAccount);

    // Wallet hasn't created a SAND token account yet.
    if (!accountInfo) {
        return 0;
    }

    const tokenAccountInfo = await getAccount(
        connection,
        tokenAccount,
        "confirmed",
        TOKEN_PROGRAM_ID
    );

    return Number(tokenAccountInfo.amount) / (10 ** 9);
}
