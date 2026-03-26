/** Result outcome for a week: new best, regression, or flat */
export type ResultType = "new" | "reg" | "flat";

/** Strategy change type for a week */
export type ChangeType = "new" | "same" | "pivot";

export interface AllBest {
	value: string;
	week: string;
}

export interface WeekEntry {
	w: string;
	strategy: string;
	beta: string | null;
	result: string;
	trend: ResultType;
	change: ChangeType;
	what: string;
	why: string;
}

export interface FunctionData {
	dim: number;
	desc: string;
	allBest: AllBest;
	weeks: WeekEntry[];
}

export type DataKey = "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8";

export type StrategyData = Record<DataKey, FunctionData>;
