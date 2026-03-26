import { useState } from "react";
import type { WeekEntry, ChangeType } from "./types";

const CHANGE_STYLES: Record<ChangeType, { label: string; cls: string }> = {
	pivot: {
		label: "strategy change",
		cls: "bg-amber-900/40 text-amber-400 border border-amber-700/50",
	},
	same: {
		label: "unchanged",
		cls: "bg-zinc-800 text-zinc-500 border border-zinc-700",
	},
	new: {
		label: "first entry",
		cls: "bg-violet-900/40 text-violet-400 border border-violet-700/50",
	},
};

export interface WeekRowProps {
	readonly week: WeekEntry;
	readonly isBest: boolean;
}

export default function WeekRow({ week, isBest }: WeekRowProps) {
	const [open, setOpen] = useState(false);

	const resultColour =
		week.trend === "new"
			? "text-emerald-400"
			: week.trend === "reg"
				? "text-red-400"
				: "text-zinc-500";

	const resultSuffix =
		week.trend === "new" ? " ↑" : week.trend === "reg" ? " ↓" : "";

	const chip = CHANGE_STYLES[week.change] ?? CHANGE_STYLES.same;

	return (
		<div
			className={`rounded-lg overflow-hidden border transition-colors ${isBest ? "row-best" : "border-zinc-800 hover:border-zinc-700"}`}
		>
			{/* Trigger row */}
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className={`row-trigger w-full grid gap-3 px-4 py-2.5 text-left transition-colors
          ${isBest ? "" : "bg-[#13161b] hover:bg-[#1a1e26]"}`}
				style={{ gridTemplateColumns: "72px 1fr 120px 24px" }}
			>
				<span
					className={`font-mono-custom text-sm font-semibold week-label text-zinc-400`}
				>
					{isBest && (
						<span className="mr-1" style={{ color: "var(--gold)" }}>
							★
						</span>
					)}
					{week.w}
				</span>

				<span className="text-sm text-zinc-400 truncate">
					{week.strategy}
					{week.beta ? ` (β=${week.beta})` : ""}
				</span>

				<span
					className={`font-mono-custom text-sm font-medium text-right ${resultColour}`}
				>
					{week.result}
					{resultSuffix}
				</span>

				<svg
					className={`chevron ${open ? "open" : ""} text-zinc-600 self-center justify-self-center`}
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="none"
				>
					<title>{open ? "Collapse" : "Expand"} row details</title>
					<path
						d="M4 2.5L8 6L4 9.5"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>

			{/* Detail panel */}
			{open && (
				<div className="bg-[#1a1e26] border-t border-zinc-800 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
							Strategy
						</span>
						<span className="text-sm text-zinc-200">
							{week.strategy}
							{week.beta ? ` — β=${week.beta}` : ""}
						</span>
						<span
							className={`self-start mt-1 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${chip.cls}`}
						>
							{chip.label}
						</span>
					</div>

					<div className="flex flex-col gap-1">
						<span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
							Result
						</span>
						<span
							className={`font-mono-custom text-sm font-medium ${resultColour}`}
						>
							{week.result}
							{resultSuffix}
						</span>
					</div>

					<div className="col-span-2 flex flex-col gap-1">
						<span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
							What happened
						</span>
						<span className="text-sm text-zinc-300 leading-relaxed">
							{week.what}
						</span>
					</div>

					<div className="col-span-2 flex flex-col gap-1">
						<span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
							Rationale
						</span>
						<span className="text-sm text-zinc-300 leading-relaxed">
							{week.why}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
