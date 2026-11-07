import { useWallets, useWalletStatus, useConnectedWallet, useConnect, useDisconnect } from "@solana/kit-plugin-wallet/react";

import { useClient } from "@solana/react";

export default function PhantomWallet() {
    const client = useClient();

    const wallets = useWallets(client);
    const status = useWalletStatus(client);
    const connected = useConnectedWallet(client);
    const connect = useConnect(client);
    const disconnect = useDisconnect(client);

    const phantom = wallets.find( (wallet) => wallet.name === "Phantom" );

    if (status === "pending") return <p className="text-sm text-gray-400">Checking wallet...</p>

    if (connected) {
        const address = connected.account.address;

        return (
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-xs text-gray-400">Connected to Phantom</p>
                    <p className="text-sm font-medium">
                        {address.slice(0, 4)}...{address.slice(-4)}
                    </p>
                </div>

                <button
                    onClick={() => disconnect.dispatch()}
                    disabled={disconnect.isRunning}
                    className="rounded-lg border border-gray-600 px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                    {disconnect.isRunning ? "Disconnecting..." : "Disconnect"}
                </button>
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
                {connect.isRunning ? "Connecting..." : "Connect Phantom"}
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