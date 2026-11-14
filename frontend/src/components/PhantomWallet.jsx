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

import { getSandBalance } from "../solana/getSandBalance";

const primaryButton =
    "rounded-full bg-[#1A7560] hover:bg-[#0F4A3C] text-white font-display font-semibold px-5 py-2 text-sm transition " +
    "disabled:cursor-not-allowed disabled:opacity-50 " +
    "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3AAB8F]/40";

const secondaryButton =
    "rounded-full border-2 border-[#D4C06A] bg-white text-[#0F4A3C] font-display font-semibold px-4 py-2 text-sm transition " +
    "hover:bg-[#FFF8D6] disabled:cursor-not-allowed disabled:opacity-50 " +
    "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3AAB8F]/40";

export default function PhantomWallet({ refreshKey }) {
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

    const [sandBalance, setSandBalance] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

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

    async function loadSandBalance(address) {
        try {
            setBalanceLoading(true);

            const balance = await getSandBalance(address);
            setSandBalance(balance);
        }
        catch (err) {
            console.error("Failed to load SAND balance:", err);
        } finally {
            setBalanceLoading(false);
        }
    }

    useEffect(() => {
        if (connected?.account?.address) {
            loadSandBalance(connected.account.address);
        }
        else {
            setSandBalance(null);
        }
    }, [connected?.account?.address, refreshKey]);

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
            setSuccess("Wallet linked to your account.");
        } catch (err) {
            setError(err.message || "Wallet verification failed.");
        } finally {
            setVerifying(false);
        }
    }

    if (status === "pending") {
        return (
            <p className="text-sm text-[#0F4A3C]/70">
                Checking wallet...
            </p>
        );
    }

    if (connected) {
        const address = connected.account.address;

        const isVerified = linkedAddress === address;
        const isLinkedElsewhere = linkedAddress && linkedAddress !== address;

        return (
            <div className="flex flex-col items-start sm:items-end gap-2">
                <div className="flex items-center gap-3 bg-white border-2 border-[#EFE3A6] rounded-3xl pl-5 pr-3 py-3">
                    <div className="sm:text-right">
                        <p className="text-sm font-semibold text-[#0F4A3C]">
                            Phantom {address.slice(0, 4)}...{address.slice(-4)}
                        </p>

                        {accountLoading ? (
                            <p className="text-xs text-[#0F4A3C]/60">
                                Checking account...
                            </p>
                        ) : isVerified ? (
                            <p className="text-xs font-bold text-[#1A7560]">
                                ✓ Wallet verified
                            </p>
                        ) : null}

                        {isVerified && (
                            <p className="mt-1 font-display text-base font-semibold text-[#1A7560]">
                                {balanceLoading
                                    ? "Loading SAND..."
                                    : sandBalance !== null
                                        ? `${sandBalance.toLocaleString()} SAND in wallet`
                                        : "SAND balance unavailable"}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => disconnect.dispatch()}
                        disabled={disconnect.isRunning || verifying}
                        className={secondaryButton}
                    >
                        {disconnect.isRunning ? "Disconnecting..." : "Disconnect"}
                    </button>
                </div>

                {!accountLoading && !isVerified && !isLinkedElsewhere && (
                    <button
                        onClick={handleVerify}
                        disabled={verifying || signMessage.isRunning}
                        className={primaryButton}
                    >
                        {verifying ? "Verifying..." : "Verify and link wallet"}
                    </button>
                )}

                {isLinkedElsewhere && (
                    <p className="text-xs font-semibold text-[#8A6A00] bg-[#FFF8D6] rounded-full px-3 py-1">
                        This account is linked to a different wallet.
                    </p>
                )}

                {success && (
                    <p className="text-xs font-semibold text-[#1A7560]">
                        {success}
                    </p>
                )}

                {error && (
                    <p role="alert" className="text-xs text-red-700">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="sm:text-right">
            <button
                onClick={() => connect.dispatch(phantom)}
                disabled={!phantom || connect.isRunning}
                className={primaryButton}
            >
                {connect.isRunning ? "Connecting..." : "Connect Phantom"}
            </button>

            {!phantom && (
                <p className="mt-2 text-xs text-[#0F4A3C]/70">
                    Phantom wasn't detected. Install the Phantom extension to connect.
                </p>
            )}

            {connect.error && (
                <p role="alert" className="mt-2 text-xs text-red-700">
                    {connect.error.message || "Unable to connect wallet."}
                </p>
            )}
        </div>
    );
}