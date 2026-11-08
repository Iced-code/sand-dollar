import { Connection, PublicKey, clusterApiUrl, Keypair, Transaction, SystemProgram} from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint, createInitializeMintInstruction, createMintToInstruction } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const DECIMALS = 9;
const INITIAL_SUPPLY = 1_000_000;

export async function createSandToken(wallet) {
    if(!wallet?.publicKey || !wallet?.signTransaction){
        throw new Error("Connect Phantom before creating the token.");
    }

    const payer = wallet.publicKey;
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    // create mint account
    const lamports = await getMinimumBalanceForRentExemptMint(connection);

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: mint,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID
        }),
        createInitializeMintInstruction(
            mint,
            DECIMALS,
            payer,
            null,
            TOKEN_PROGRAM_ID
        )
    );

    transaction.feePayer = payer;
    transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
    ).blockhash;

    transaction.partialSign(mintKeypair);

    const signedTransaction = await wallet.signTransaction( transaction );
    const signature = await connection.sendRawTransaction( signedTransaction.serialize() );
    await connection.confirmTransaction(signature, "confirmed");

    return {
        mintAddress: mint.toBase58(),
        transactionSignature: signature
    }
}