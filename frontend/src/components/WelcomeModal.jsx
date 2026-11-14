import { useEffect, useRef } from "react";

const steps = [
    {
        title: "Connect Phantom",
        body: "Link your wallet so your SAND has somewhere to land. Set Phantom to Devnet first."
    },
    {
        title: "Play and paste",
        body: "Finish today's Wordle or Connections, copy your result, and paste it into its card."
    },
    {
        title: "Collect SAND",
        body: "Your reward is sent to your wallet, and you can see it on Solana Explorer."
    }
];

export default function WelcomeModal({ onClose }) {
    const buttonRef = useRef(null);

    // Focus the button on open, close on Escape, and stop the page behind from scrolling
    useEffect(() => {
        buttonRef.current?.focus();

        function handleKeyDown(event) {
            if (event.key === "Escape") onClose();
        }

        document.addEventListener("keydown", handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F4A3C]/50"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="welcome-title"
                onClick={(event) => event.stopPropagation()}
                className="reward-pop relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#FFFCF2] rounded-[2.5rem_3.5rem_2.5rem_3rem] border-2 border-[#EFE3A6] shadow-[0_8px_0_#EFE3A6]"
            >
                {/* Sand blob header */}
                <div className="speckled bg-[#F7E06D] px-8 pt-8 pb-7 rounded-b-[2.5rem] text-center">
                    <h2
                        id="welcome-title"
                        className="sand-heading font-display text-3xl font-bold mt-4"
                    >
                        Welcome to Sand Dollar
                    </h2>
                    <p className="text-[#0F4A3C] mt-1">
                        Share your daily puzzles and collect SAND.
                    </p>
                </div>

                <div className="px-8 pt-6 pb-8">
                    <ol className="space-y-5">
                        {steps.map((step, index) => (
                            <li key={step.title} className="flex flex-col items-center text-center">
                                <span className="shrink-0 w-9 h-9 rounded-full bg-[#3AAB8F] text-white font-display font-semibold flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <h3 className="sand-heading font-display text-lg font-semibold mt-2">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-[#0F4A3C]/75 mt-0.5 max-w-[22rem]">
                                    {step.body}
                                </p>
                            </li>
                        ))}
                    </ol>

                    <p className="text-xs text-[#0F4A3C]/60 mt-6 text-center">
                        Sand Dollar runs on Solana devnet, so SAND has no real-world value.
                    </p>

                    <button
                        ref={buttonRef}
                        onClick={onClose}
                        className="mt-5 w-full rounded-full bg-[#1A7560] hover:bg-[#0F4A3C] text-white font-display font-semibold text-lg px-6 py-3 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3AAB8F]/40"
                    >
                        Let's go
                    </button>
                </div>
            </div>
        </div>
    );
}