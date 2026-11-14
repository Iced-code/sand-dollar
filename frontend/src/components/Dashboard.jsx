import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

import WordleSubmission from "./WordleSubmission";
import ConnectionsSubmission from "./ConnectionsSubmission";

import PhantomWallet from "./PhantomWallet";
import Leaderboard from "./Leaderboard";

import WelcomeModal from "./WelcomeModal"

function getTodaysDate() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = Object.fromEntries(
        parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
}

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [refreshKey, setRefreshKey] = useState(0);

    const [showWelcome, setShowWelcome] = useState(() => {
        try {
            return !localStorage.getItem("sanddollar_welcomed");
        } catch {
            return true;
        }
    });

    function closeWelcome() {
        setShowWelcome(false);
        try {
            localStorage.setItem("sanddollar_welcomed", "1");
        } catch {
            // storage unavailable (e.g. private mode); the popup just shows again next visit
    }
    }

    useEffect(() => {
        async function loadDashboard() {
            try {
                const userData = await apiFetch("/users/me");
                setUser(userData);

                const balanceData = await apiFetch("/users/me/balance");
                const submissionData = await apiFetch("/users/me/submissions");

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
        return (
            <div className="min-h-screen flex items-center justify-center font-display text-xl text-[#1A7560]">
                Loading your dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-md mx-auto mt-16 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl">
                Couldn't load your dashboard: {error}
            </div>
        );
    }

    async function handleSubmissionCreated(newSubmission) {
        setSubmissions((previous) => [newSubmission, ...previous]);

        const updatedBalance = await apiFetch("/users/me/balance");
        setBalance(updatedBalance);

        setRefreshKey((previous) => previous + 1);
    }

    const today = getTodaysDate();
    const wordleTodaySubmission = submissions.find(
        submission => submission.puzzle_date === today && submission.result_data.game.toLowerCase() === "wordle"
    );
    const connectionsTodaySubmission = submissions.find(
        submission => submission.puzzle_date === today && submission.result_data.game.toLowerCase() === "connections"
    );

    function getGameName(submission) {
        return submission.result_data.game;
    }

    function getSubmissionTitle(submission) {
        return `${getGameName(submission)} #${submission.result_data.puzzle_number}`;
    }

    function getSubmissionDescription(submission) {
        const result = submission.result_data;

        if (getGameName(submission) === "Connections") {
            return result.won
                ? `Solved all 4 categories with ${result.mistakes} mistakes`
                : `${result.solved_categories}/4 categories solved`;
        }
        else if (getGameName(submission) === "Wordle") {
            return result.won
                ? `Solved in ${result.attempts}/6 attempts`
                : "Not solved";
        }
    }

    function gameChipClass(submission) {
        return getGameName(submission) === "Connections"
            ? "bg-[#F7E06D] text-[#0F4A3C]"
            : "bg-[#3AAB8F]/20 text-[#0F4A3C]";
    }

    return (
        <main className="min-h-screen bg-[#FFFCF2] text-[#0F4A3C] p-6 md:p-10">
            {showWelcome && <WelcomeModal onClose={closeWelcome} />}
            
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <header className="sticky-header mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4 scroll-smooth">
                        <a href="#" target="">
                            <img
                                src="/sand_dollar_logo.png"
                                alt="Sand Dollar"
                                className="h-32 w-auto"
                            />
                        </a>
                        <p className="text-[#0F4A3C]/70 hidden md:block">
                            Share your daily puzzles. Collect SAND.
                        </p>

                        <button
                            onClick={() => setShowWelcome(true)}
                            className="text-sm font-semibold text-[#1A7560] underline underline-offset-4 hover:text-[#0F4A3C] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3AAB8F]/40 rounded"
                        >
                            How it works
                        </button>
                    </div>

                    <PhantomWallet refreshKey={refreshKey} />
                </header>

                {/* Hero: balance on a sand blob (the one loud element on the page) */}
                <section className="speckled bg-[#F7E06D] rounded-[2.5rem_3.5rem_2.5rem_4rem] p-8 md:p-10 mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[#0F4A3C]/80 font-semibold">
                            Welcome back, {user.username}
                        </p>

                        <div className="flex items-baseline gap-3 mt-2">
                            <span className="font-display text-6xl md:text-7xl font-bold text-[#1A7560] leading-none">
                                {Number(balance.balance).toLocaleString()}
                            </span>
                            <span className="font-display text-2xl font-semibold text-[#3AAB8F]">
                                SAND
                            </span>
                        </div>
                    </div>

                    <div className="md:text-right">
                        <p className="text-[#0F4A3C] font-semibold">
                            Submit today's puzzles to earn more.
                        </p>
                        <p className="text-[#0F4A3C]/60 text-xs mt-2">
                            Player ID: {user.public_id}
                        </p>
                    </div>
                </section>

                <Leaderboard refreshKey={refreshKey} username={user.username}/>

                {/* Game cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-6 mb-12">

                    <WordleSubmission
                        onSubmitted={handleSubmissionCreated}
                        todaysSubmission={wordleTodaySubmission}
                    />

                    <ConnectionsSubmission
                        onSubmitted={handleSubmissionCreated}
                        todaysSubmission={connectionsTodaySubmission}
                    />

                    {/* Future game card */}
                    <div className="border-2 border-dashed border-[#D4C06A] rounded-[2rem] p-6 flex flex-col items-center justify-center h-full min-h-[440px] text-center">
                        <div className="w-14 h-14 rounded-full bg-[#F7E06D]/60 flex items-center justify-center mb-4">
                            <span className="font-display text-3xl text-[#1A7560]">🦐</span>
                        </div>

                        <h2 className="font-display text-xl font-semibold text-[#1A7560] sand-heading">
                            Krillion<br/>coming soon!
                        </h2>
                    </div>

                </section>

                {/* Submission history */}
                <section>
                    <div className="flex items-baseline justify-between mb-5">
                        <h2 className="font-display text-2xl font-semibold text-[#1A7560] sand-heading">
                            Recent activity
                        </h2>

                        <span className="text-[#0F4A3C]/60 text-sm">
                            {submissions.length} {submissions.length === 1 ? "submission" : "submissions"}
                        </span>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="speckled bg-[#FFF8D6] rounded-3xl p-10 text-center">
                            <p className="font-display text-xl text-[#1A7560]">
                                Nothing here yet
                            </p>
                            <p className="text-[#0F4A3C]/70 mt-1">
                                Paste today's Wordle or Connections result above to earn your first SAND.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.map((submission) => (
                                <div
                                    key={submission.id}
                                    className="bg-white border-2 border-[#EFE3A6] rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-display text-lg font-semibold">
                                                {getSubmissionTitle(submission)}
                                            </h3>
                                            <span className={`rounded-full text-xs font-bold px-2.5 py-0.5 ${gameChipClass(submission)}`}>
                                                {new Date(
                                                    submission.puzzle_date + "T00:00:00"
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <p className="text-[#0F4A3C]/70 text-sm mt-1">
                                            {getSubmissionDescription(submission)}
                                        </p>
                                    </div>

                                    <div className="text-left md:text-right">
                                        <p className="inline-block rounded-full bg-[#F7E06D] px-4 py-1 font-display text-lg font-semibold text-[#1A7560]">
                                            +{submission.reward_amount} SAND
                                        </p>

                                        {/* <p className="text-[#0F4A3C]/55 text-xs mt-1">
                                            {new Date(
                                                submission.submitted_at
                                            ).toLocaleString()}
                                        </p> */}
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