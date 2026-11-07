
import { useEffect, useState } from "react";

import {
    useWallets,
    useWalletStatus,
    useConnectedWallet,
    useConnect,
    useDisconnect,
    useSignMessage
} from "@solana/kit-plugin-wallet/react";

import { useClient } from "@solana/react";
import { apiFetch, getCurrentUser } from "../api/client";

export default function PhantomWallet() {
    const client = useClient();

    const wallets = useWallets(client);
    const status = useWalletStatus(client);
    const connected = useConnectedWallet(client);
    const connect = useConnect(client);
    const disconnect = useDisconnect(client);
    const signMessage = useSignMessage(client);

    const [linkedAddress, setLinkedAddress] = useState(null);
    const [accountLoading, setAccountLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load the wallet already linked to this Sand Dollar account
    useEffect(() => {
        let active = true;

        async function loadAccount() {
            try {
                const user = await getCurrentUser();

                if (active) {
                    setLinkedAddress(user.wallet_address || null);
                }
            } catch (err) {
                if (active) {
                    setError(err.message || "Unable to load account.");
                }
            } finally {
                if (active) {
                    setAccountLoading(false);
                }
            }
        }

        loadAccount();

        return () => {
            active = false;
        };
    }, []);

    const phantom = wallets.find(
        (wallet) => wallet.name === "Phantom"
    );

    async function handleVerify() {
        if (!connected) return;

        const address = connected.account.address;

        setVerifying(true);
        setError("");
        setSuccess("");

        try {
            // 1. Request a verification challenge
            const challenge = await apiFetch("/wallet/challenge", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    wallet_address: address
                })
            });

            // 2. Sign the exact challenge message
            const signatureBytes = await signMessage.dispatchAsync(
                new TextEncoder().encode(challenge.message)
            );

            // 3. Convert signature to Base64
            const signatureBase64 = btoa(
                Array.from(signatureBytes)
                    .map((byte) => String.fromCharCode(byte))
                    .join("")
            );

            // 4. Verify signature with FastAPI
            await apiFetch("/wallet/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    challenge_id: challenge.challenge_id,
                    wallet_address: address,
                    signature: signatureBase64
                })
            });

            setLinkedAddress(address);
            setSuccess("Wallet successfully linked to your account!");
        } catch (err) {
            setError(err.message || "Wallet verification failed.");
        } finally {
            setVerifying(false);
        }
    }

    if (status === "pending") {
        return (
            <p className="text-sm text-gray-400">
                Checking wallet...
            </p>
        );
    }

    if (connected) {
        const address = connected.account.address;

        const isVerified = linkedAddress === address;
        const isLinkedElsewhere =
            linkedAddress && linkedAddress !== address;

        return (
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs text-gray-400">
                            Connected to Phantom
                        </p>

                        <p className="text-sm font-medium">
                            {address.slice(0, 4)}...{address.slice(-4)}
                        </p>

                        {accountLoading ? (
                            <p className="text-xs text-gray-400">
                                Checking account...
                            </p>
                        ) : isVerified ? (
                            <p className="text-xs text-green-400">
                                ✓ Wallet Verified
                            </p>
                        ) : null}
                    </div>

                    <button
                        onClick={() => disconnect.dispatch()}
                        disabled={disconnect.isRunning || verifying}
                        className="rounded-lg border border-gray-600 px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-50"
                    >
                        {disconnect.isRunning
                            ? "Disconnecting..."
                            : "Disconnect"}
                    </button>
                </div>

                {!accountLoading && !isVerified && !isLinkedElsewhere && (
                    <button
                        onClick={handleVerify}
                        disabled={verifying || signMessage.isRunning}
                        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {verifying
                            ? "Verifying..."
                            : "Verify & Link Wallet"}
                    </button>
                )}

                {isLinkedElsewhere && (
                    <p className="text-xs text-yellow-400">
                        This account is linked to a different wallet.
                    </p>
                )}

                {success && (
                    <p className="text-xs text-green-400">
                        {success}
                    </p>
                )}

                {error && (
                    <p className="text-xs text-red-400">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={() => connect.dispatch(phantom)}
                disabled={!phantom || connect.isRunning}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {connect.isRunning
                    ? "Connecting..."
                    : "Connect Phantom"}
            </button>

            {!phantom && (
                <p className="mt-2 text-xs text-gray-400">
                    Phantom wallet not detected. Please install Phantom.
                </p>
            )}

            {connect.error && (
                <p className="mt-2 text-xs text-red-400">
                    {connect.error.message || "Unable to connect wallet."}
                </p>
            )}
        </div>
    );
}
