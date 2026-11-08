import { useState } from "react";
import { apiFetch } from "../api/client";
import GameCard from "./GameCard";

export default function ConnectionsSubmission({ onSubmitted, todaysSubmission }) {
    const [rawResult, setRawResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    const submittedResult = todaysSubmission || success;
    // Only animate when the reward just arrived, not on every page load
    const justSubmitted = !!success;

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess(null);

        if (!rawResult.trim()) {
            setError("Paste your Connections result first.");
            return;
        }

        setLoading(true);

        try {
            const result = await apiFetch("/games/connections/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ raw_result: rawResult })
            });

            setSuccess(result);
            setRawResult("");

            if (onSubmitted) {
                await onSubmitted(result);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <GameCard
            title="Connections"
            subtitle="Copy your result from Connections and paste it here."
            done={!!submittedResult}
        >
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
                <textarea
                    value={submittedResult ? submittedResult.raw_result : rawResult}
                    onChange={(e) => setRawResult(e.target.value)}
                    readOnly={!!submittedResult}
                    placeholder={"Connections\nPuzzle #1245\n\n🟨🟨🟨🟨\n🟪🟦🟦🟪\n🟪🟦🟩🟩\n🟩🟦🟪🟦\n🟩🟪🟩🟪"}
                    className={`flex-1 min-h-[10rem] resize-none w-full rounded-2xl p-4 text-sm font-mono
                        border-2 text-[#0F4A3C] placeholder-[#0F4A3C]/35
                        focus:outline-none focus:border-[#3AAB8F] focus:ring-4 focus:ring-[#3AAB8F]/25
                        ${submittedResult
                            ? "bg-[#FFF8D6] border-[#EFE3A6]"
                            : "bg-[#FFFCF2] border-[#EFE3A6]"}`}
                    required
                />

                {error && (
                    <div role="alert" className="bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-3 text-sm">
                        {error}
                    </div>
                )}

                {submittedResult && (
                    <div className={`bg-[#3AAB8F] text-white rounded-2xl p-4 ${justSubmitted ? "reward-pop" : ""}`}>
                        <p className="font-display text-3xl font-semibold leading-none">
                            +{submittedResult.reward_amount} SAND
                        </p>
                        <p className="text-white/90 text-sm mt-2">
                            Connections #{submittedResult.result_data?.puzzle_number}
                        </p>

                        {submittedResult.payout_status === "paid" && submittedResult.payout_signature && (
                            <a
                                href={`https://explorer.solana.com/tx/${submittedResult.payout_signature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-sm font-bold underline underline-offset-4 mt-2 hover:text-[#F7E06D] focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                            >
                                View transaction on Solana Explorer ↗
                            </a>
                        )}
                    </div>
                )}

                {!submittedResult && (
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-full bg-[#1A7560] hover:bg-[#0F4A3C] disabled:opacity-50 disabled:cursor-not-allowed
                            text-white font-display font-semibold text-lg px-6 py-3 transition
                            focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3AAB8F]/40"
                    >
                        {loading ? "Sending your result..." : "Submit result"}
                    </button>
                )}
            </form>
        </GameCard>
    );
}