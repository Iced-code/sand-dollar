import { ClientProvider } from "@solana/react";
import { solanaClient } from "./client";

export default function SolanaProvider({ children }) {
    return (
        <ClientProvider client={solanaClient}>
            {children}
        </ClientProvider>
    );
}