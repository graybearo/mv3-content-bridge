export interface Bridge {
	GET_PAGE_STATE: { input: void; output: { user: string; count: number; loadedAt: number } };
	INCREMENT_PAGE_COUNT: { input: { by: number }; output: { count: number } };
}
