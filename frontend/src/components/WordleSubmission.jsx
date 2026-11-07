
import { useState } from "react";
import { apiFetch } from "../api/client";

/* function getLocalDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
} */

export default function WordleSubmission({ onSubmitted, todaysSubmission }) {
    const [rawResult, setRawResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    const submittedResult = todaysSubmission || success;

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
                    raw_result: rawResult
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
        <section className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6 h-full flex flex-col">
            <div className="mb-5">
                <h2 className="text-xl font-semibold">
                    Submit a Wordle Result
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                    Copy your Wordle results and paste them below to earn SAND.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
                <div>
                    <label className="block text-sm text-gray-300 mb-2">
                        Wordle Results
                    </label>

                    <textarea
                        value={rawResult}
                        onChange={(e) => setRawResult(e.target.value)}
                        placeholder={"Wordle 1,234 5/6\n\n⬛🟨⬛⬛⬛\n⬛🟨⬛⬛🟩\n🟨🟩⬛⬛🟩\n🟩🟩🟨⬛🟩\n🟩🟩🟩🟩🟩"}
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

                {submittedResult && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                        <p className="text-green-400 font-semibold">
                            Wordle submitted successfully!
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Puzzle #{submittedResult.result_data?.puzzle_number}
                        </p>
                        <p className="text-green-400 font-bold text-lg mt-2">
                           +{submittedResult.reward_amount} SAND
                        </p>
                    </div>
                )}

                {!submittedResult && (
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded-lg transition mt-auto"
                    >
                        {loading ? "Submitting..." : "Submit"}
                    </button>
                )}
            </form>
        </section>
    );
}