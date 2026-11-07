
import { useState } from "react";
import { apiFetch } from "../api/client";

function getLocalDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default function WordleSubmission({ onSubmitted }) {
    const [rawResult, setRawResult] = useState("");
    const [puzzleDate, setPuzzleDate] = useState(getLocalDate());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess(null);

        if (!rawResult.trim()) {
            setError("Please paste your Wordle result.");
            return;
        }

        setLoading(true);

        try {
            const result = await apiFetch("/games/wordle/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    raw_result: rawResult,
                    puzzle_date: puzzleDate
                })
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
        <section className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6 mb-10">
            <div className="mb-5">
                <h2 className="text-xl font-semibold">
                    Submit a Wordle Result
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                    Copy your Wordle results and paste them below to earn SAND.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm text-gray-300 mb-2">
                        Wordle Results
                    </label>

                    <textarea
                        value={rawResult}
                        onChange={(e) => setRawResult(e.target.value)}
                        placeholder={"Wordle 1,234 3/6\n\n⬛🟨⬛⬛🟩\n🟨🟩⬛⬛🟩\n🟩🟩🟩🟩🟩"}
                        rows={7}
                        className="w-full bg-[#101014] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 resize-y font-mono text-sm"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg p-4">
                        <p className="font-semibold">
                            Wordle submitted successfully!
                        </p>
                        <p className="text-sm mt-1">
                            You earned {success.reward_amount} SAND.
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded-lg transition"
                >
                    {loading ? "Submitting..." : "Submit Result"}
                </button>
            </form>
        </section>
    );
}
