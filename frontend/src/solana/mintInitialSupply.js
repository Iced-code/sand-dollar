
import {
    Connection,
    PublicKey,
    clusterApiUrl,
    Transaction
} from "@solana/web3.js";

import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    getMint
} from "@solana/spl-token";

const connection = new Connection(
    clusterApiUrl("devnet"),
    "confirmed"
);

const SAND_MINT_ADDRESS =
    "DDrtiXyiqs4diFmqiACLfqtJd3LvSzEcnyMMFjYnz2zP";

const INITIAL_SUPPLY = 1_000_000;
const DECIMALS = 9;

export async function mintInitialSupply(wallet) {
    if (!wallet?.publicKey || !wallet?.signTransaction) {
        throw new Error("Connect Phantom first.");
    }

    const owner = wallet.publicKey;
    const mint = new PublicKey(SAND_MINT_ADDRESS);

    // Confirm the mint exists and has the expected authority.
    const mintInfo = await getMint(connection, mint);

    if (!mintInfo.mintAuthority?.equals(owner)) {
        throw new Error("Connected wallet is not the mint authority.");
    }

    if (mintInfo.decimals !== DECIMALS) {
        throw new Error("Unexpected SAND token decimals.");
    }

    // Prevent accidentally minting the initial supply twice.
    if (mintInfo.supply > 0n) {
        throw new Error("SAND supply has already been created.");
    }

    // Derive the associated token account for this wallet.
    const tokenAccount = getAssociatedTokenAddressSync(
        mint,
        owner,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction();

    // Create the token account if it doesn't exist.
    const accountInfo = await connection.getAccountInfo(tokenAccount);

    if (!accountInfo) {
        transaction.add(
            createAssociatedTokenAccountInstruction(
                owner,
                tokenAccount,
                owner,
                mint,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
        );
    }

    // Convert 1,000,000 SAND into base units.
    const amount = BigInt(INITIAL_SUPPLY) * (10n ** BigInt(DECIMALS));

    // Mint the initial supply.
    transaction.add(
        createMintToInstruction(
            mint,
            tokenAccount,
            owner,
            amount,
            [],
            TOKEN_PROGRAM_ID
        )
    );

    transaction.feePayer = owner;

    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;

    const signedTransaction = await wallet.signTransaction(transaction);

    const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
    );

    await connection.confirmTransaction({
        signature,
        ...latestBlockhash
    }, "confirmed");

    return {
        tokenAccount: tokenAccount.toBase58(),
        transactionSignature: signature,
        supply: INITIAL_SUPPLY
    };
}
