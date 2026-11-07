import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

import WordleSubmission from "./WordleSubmission";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [userData, balanceData, submissionData] =
                    await Promise.all([
                        apiFetch("/users/me"),
                        apiFetch("/users/me/balance"),
                        apiFetch("/users/me/submissions")
                    ]);

                setUser(userData);
                setBalance(balanceData);
                setSubmissions(submissionData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading dashboard...</div>;
    }
    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

    async function handleSubmissionCreated(newSubmission) {
        setSubmissions((previous) => [
            newSubmission,
            ...previous
        ]);

        const updatedBalance = await apiFetch("/users/me/balance");
        setBalance(updatedBalance);
    }

    return (
        <main className="min-h-screen bg-[#101014] text-white p-6 md:p-10">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold">
                        Sand Dollar
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Your puzzle activity at a glance.
                    </p>
                </header>

                {/* User and balance */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">

                    <div className="bg-[#1c1c24] rounded-2xl p-6 border border-white/10">
                        <p className="text-gray-400 text-sm">
                            Welcome back
                        </p>

                        <h2 className="text-2xl font-semibold mt-2">
                            {user.username}
                        </h2>

                        <p className="text-gray-500 text-xs mt-3">
                            Player ID: {user.public_id}
                        </p>
                    </div>

                    <div className="bg-[#1c1c24] rounded-2xl p-6 border border-white/10">
                        <p className="text-gray-400 text-sm">
                            Your SAND balance
                        </p>

                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-bold text-amber-400">
                                {Number(balance.balance).toLocaleString()}
                            </span>

                            <span className="text-amber-400 font-semibold">
                                SAND
                            </span>
                        </div>

                        <p className="text-gray-500 text-xs mt-3">
                            Earn more by completing daily puzzles.
                        </p>
                    </div>

                </section>


                <WordleSubmission onSubmitted={handleSubmissionCreated} />

                {/* Submission history */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-semibold">
                            Recent Activity
                        </h2>

                        <span className="text-gray-500 text-sm">
                            {submissions.length} submissions
                        </span>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="bg-[#1c1c24] rounded-2xl p-8 text-center">
                            <p className="text-gray-400">
                                No puzzle submissions yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.map((submission) => (
                                <div
                                    key={submission.id}
                                    className="bg-[#1c1c24] rounded-xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div>
                                        <h3 className="font-semibold">
                                            Wordle #{submission.result_data.puzzle_number}
                                        </h3>

                                        <p className="text-gray-400 text-sm mt-1">
                                            {new Date(
                                                submission.puzzle_date + "T00:00:00"
                                            ).toLocaleDateString()}
                                        </p>

                                        <p className="text-gray-500 text-sm mt-1">
                                            {submission.result_data.won
                                                ? `Solved in ${submission.result_data.attempts}/6 attempts`
                                                : "Not solved"}
                                        </p>
                                    </div>

                                    <div className="text-left md:text-right">
                                        <p className="text-amber-400 font-bold text-lg">
                                            +{submission.reward_amount} SAND
                                        </p>

                                        <p className="text-gray-500 text-xs">
                                            {new Date(
                                                submission.submitted_at
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </main>
    );
}