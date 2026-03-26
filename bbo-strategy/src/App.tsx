import { useState } from "react";
import { DATA } from "./data";
import type { DataKey } from "./types";
import WeekRow from "./WeekRow";

const LEGEND_ITEMS: Array<
	| { dot: string; label: string }
	| { symbol: string; colour: string; label: string }
	| { dotCls: string; label: string }
> = [
	{ dot: "var(--gold-border)", label: "Best week ever" },
	{ symbol: "↑", colour: "text-emerald-400", label: "new best" },
	{ symbol: "↓", colour: "text-red-400", label: "regression" },
	{
		dotCls: "bg-amber-900/50 border border-amber-700/50",
		label: "strategy change",
	},
	{ dotCls: "bg-zinc-800 border border-zinc-700", label: "unchanged" },
];

export default function App() {
	const [active, setActive] = useState<DataKey>("F1");
	const fnKeys = Object.keys(DATA) as DataKey[];
	const fn = DATA[active];

	return (
		<div className="max-w-3xl mx-auto px-6 py-10 pb-20">
			<div className="mb-8">
				<h1 className="font-mono-custom text-xl font-semibold text-zinc-100 mb-1 tracking-tight">
					BBO Strategy History — <span className="text-sky-400">W1 → W12</span>
				</h1>
				<p className="text-sm text-zinc-600">
					Select a function to review its strategy evolution. ★ marks the
					all-time best week. Click any row to expand.
				</p>
			</div>

			<div className="grid grid-cols-8 gap-2 mb-8">
				{fnKeys.map((key) => {
					const d = DATA[key];
					const isActive = key === active;
					return (
						<button
							type="button"
							key={key}
							onClick={() => setActive(key)}
							className={`rounded-lg border px-2 py-2.5 text-center transition-all cursor-pointer
                ${
									isActive
										? "border-sky-600 bg-sky-950/60"
										: "border-zinc-800 bg-[#13161b] hover:border-zinc-700 hover:bg-[#1a1e26]"
								}`}
						>
							<div className="font-mono-custom text-sm font-semibold text-zinc-100 mb-0.5">
								{key}
							</div>
							<div className="text-xs text-zinc-600 mb-1">{d.dim}D</div>
							<div className="font-mono-custom text-xs text-emerald-400 leading-tight">
								{d.allBest.value}
							</div>
							<div className="text-xs text-zinc-600 mt-0.5">
								{d.allBest.week}
							</div>
						</button>
					);
				})}
			</div>

			<div>
				<div className="flex items-baseline gap-3 pb-3 border-b border-zinc-800 mb-4">
					<span className="font-mono-custom text-2xl font-semibold text-zinc-100">
						{active}
					</span>
					<span className="font-mono-custom text-sm text-zinc-600">
						{fn.dim}D
					</span>
					<span className="text-sm text-zinc-500 flex-1">{fn.desc}</span>
					<span
						className="font-mono-custom text-sm px-2.5 py-1 rounded border"
						style={{
							background: "var(--gold-dim)",
							borderColor: "var(--gold-border)",
							color: "var(--gold)",
						}}
					>
						★ {fn.allBest.value} ({fn.allBest.week})
					</span>
				</div>

				<div className="flex flex-wrap gap-4 mb-4">
					{LEGEND_ITEMS.map((item, i) => (
						<div
							key={i}
							className="flex items-center gap-1.5 text-sm text-zinc-600"
						>
							{"dot" in item ? (
								<span
									className="w-2.5 h-2.5 rounded-sm"
									style={{ background: item.dot }}
								></span>
							) : "symbol" in item ? (
								<span className={item.colour}>{item.symbol}</span>
							) : (
								<span
									className={`w-2.5 h-2.5 rounded-sm ${item.dotCls}`}
								></span>
							)}
							{item.label}
						</div>
					))}
				</div>

				<div className="flex flex-col gap-1.5">
					{fn.weeks.map((week, i) => (
						<WeekRow key={i} week={week} isBest={week.w === fn.allBest.week} />
					))}
				</div>
			</div>
		</div>
	);
}
