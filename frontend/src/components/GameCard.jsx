export default function GameCard({ title, subtitle, done = false, children }) {
    return (
        <section className="bg-white border-2 border-[#EFE3A6] rounded-[2rem] p-6 h-full min-h-[440px] flex flex-col shadow-[0_6px_0_#EFE3A6]">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl font-semibold text-[#1A7560] sand-heading">
                        {title}
                    </h2>
                    <p className="text-[#0F4A3C]/70 text-sm mt-1">
                        {subtitle}
                    </p>

                    {done && (
                        <span className="shrink-0 rounded-full bg-[#F7E06D] text-[#0F4A3C] text-xs font-bold px-3 py-1">
                            Complete!
                        </span>
                    )}
                </div>
            </div>

            {children}
        </section>
    );
}