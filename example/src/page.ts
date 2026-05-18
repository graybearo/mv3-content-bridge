import { serve } from "mv3-content-bridge";
import type { Bridge } from "./shared/bridge";

interface DemoState {
	user: string;
	count: number;
	loadedAt: number;
}

declare global {
	interface Window {
		__demoState?: DemoState;
	}
}

window.__demoState = {
	user: "demo",
	count: 0,
	loadedAt: Date.now(),
};

serve<Bridge>({
	GET_PAGE_STATE: () => {
		if (!window.__demoState) throw new Error("page state not initialized");
		return { ...window.__demoState };
	},
	INCREMENT_PAGE_COUNT: ({ by }) => {
		if (!window.__demoState) throw new Error("page state not initialized");
		window.__demoState.count += by;
		return { count: window.__demoState.count };
	},
});

console.log("[page] mv3-content-bridge server up, __demoState =", window.__demoState);
