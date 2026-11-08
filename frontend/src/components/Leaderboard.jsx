import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

// Top three get color; everyone else stays quiet
function rankBadgeClass(rank) {
    if (rank === 1) return "bg-[#F7E06D] text-[#0F4A3C]";
    if (rank === 2) return "bg-[#3AAB8F]/25 text-[#0F4A3C]";
    if (rank === 3) return "bg-[#D4C06A]/40 text-[#0F4A3C]";
    return "bg-transparent text-[#0F4A3C]/55";
}

export default function Leaderboard() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadLeaderboard() {
            try {
                const data = await apiFetch("/leaderboard");
                setPlayers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadLeaderboard();
    }, []);

    return (
        <section className="bg-white border-2 border-[#EFE3A6] rounded-[2rem] p-6 mb-10 shadow-[0_6px_0_#EFE3A6]">
            <div className="mb-5">
                <h2 className="font-display text-2xl font-semibold text-[#1A7560] sand-heading">
                    Leaderboard
                </h2>
                <p className="text-sm text-[#0F4A3C]/70 mt-1">
                    Top players by SAND earned
                </p>
            </div>

            {loading && (
                <p className="text-[#0F4A3C]/70">Loading leaderboard...</p>
            )}

            {error && (
                <p role="alert" className="text-red-700">
                    Couldn't load the leaderboard: {error}
                </p>
            )}

            {!loading && !error && players.length === 0 && (
                <div className="speckled bg-[#FFF8D6] rounded-2xl p-6 text-center">
                    <p className="font-display text-lg text-[#1A7560]">
                        No one's on the board yet
                    </p>
                    <p className="text-sm text-[#0F4A3C]/70 mt-1">
                        Submit a puzzle to take the first spot.
                    </p>
                </div>
            )}

            {!loading && !error && players.length > 0 && (
                <ol className="space-y-2">
                    {players.map((player) => (
                        <li
                            key={player.rank}
                            className="flex items-center justify-between bg-[#FFFCF2] border-2 border-[#F3EBC4] rounded-2xl px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={`font-display font-semibold w-9 h-9 rounded-full flex items-center justify-center ${rankBadgeClass(player.rank)}`}
                                >
                                    {player.rank}
                                </span>
                                <span className="font-semibold text-[#0F4A3C]">
                                    {player.username}
                                </span>
                            </div>

                            <p className="font-display text-lg font-semibold text-[#1A7560]">
                                {player.total_earned.toLocaleString()} SAND
                            </p>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}