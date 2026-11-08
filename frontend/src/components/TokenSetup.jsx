
import { useState } from "react";
import { mintInitialSupply } from "../solana/mintInitialSupply";

export default function TokenSetup() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    async function handleMintSupply() {
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const provider = window.phantom?.solana;

            if (!provider) {
                throw new Error("Phantom wallet not detected.");
            }

            if (!provider.isConnected) {
                await provider.connect();
            }

            const mintResult = await mintInitialSupply(provider);
            setResult(mintResult);

            console.log("SAND mint transaction:", mintResult.transactionSignature);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to mint SAND.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-2 text-lg font-bold">SAND Token Setup</h2>

            <p className="mb-4 text-sm text-gray-400">
                Mint the initial 1,000,000 SAND supply to your connected Phantom wallet on Solana Devnet.
            </p>

            <button
                onClick={handleMintSupply}
                disabled={loading || !!result}
                className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading
                    ? "Minting SAND..."
                    : result
                        ? "Initial Supply Minted"
                        : "Mint 1,000,000 SAND"}
            </button>

            {result && (
                <div className="mt-4 rounded-lg bg-green-900/30 p-4 text-sm">
                    <p className="font-semibold text-green-400">
                        Successfully minted 1,000,000 SAND!
                    </p>

                    <p className="mt-2 break-all text-gray-300">
                        Token Account: {result.tokenAccount}
                    </p>

                    <a
                        href={`https://explorer.solana.com/tx/${result.transactionSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-purple-400 underline"
                    >
                        View transaction on Solana Explorer
                    </a>
                </div>
            )}

            {error && (
                <p className="mt-4 text-sm text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}






/* 
import { useState } from "react";
import { createSandToken } from "../solana/createToken";

export default function TokenSetup() {
    const [loading, setLoading] = useState(false);
    const [mintAddress, setMintAddress] = useState("");
    const [error, setError] = useState("");

    async function handleCreateToken() {
        setLoading(true);
        setError("");

        try {
            const provider = window.phantom?.solana;

            if (!provider) {
                throw new Error("Phantom wallet not detected.");
            }

            if (!provider.isConnected) {
                await provider.connect();
            }

            const result = await createSandToken(provider);

            setMintAddress(result.mintAddress);

            console.log(
                "SAND mint transaction:",
                result.transactionSignature
            );
        } catch (err) {
            console.error(err);
            setError(err.message || "Token creation failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-2 text-lg font-bold">
                SAND Token Setup
            </h2>

            <p className="mb-4 text-sm text-gray-400">
                Create the Sand Dollar SPL token on Solana Devnet.
            </p>

            <button
                onClick={handleCreateToken}
                disabled={loading || !!mintAddress}
                className="rounded-lg bg-purple-600 px-5 py-2 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
                {loading ? "Creating Token..." : "Create SAND Token"}
            </button>

            {mintAddress && (
                <div className="mt-4">
                    <p className="text-sm font-semibold text-green-400">
                        SAND mint created successfully!
                    </p>

                    <p className="mt-2 break-all text-xs text-gray-300">
                        {mintAddress}
                    </p>

                    <a
                        href={`https://explorer.solana.com/address/${mintAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm text-purple-400 underline"
                    >
                        View on Solana Explorer
                    </a>
                </div>
            )}

            {error && (
                <p className="mt-3 text-sm text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
 */