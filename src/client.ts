import { type BridgeMap, ContentBridgeError } from "./types";
import { MARKER, type RequestEnvelope, isReply } from "./envelope";

export interface ClientOptions {
	namespace?: string;
	timeoutMs?: number;
}

export interface Client<M extends BridgeMap> {
	send: <K extends keyof M>(type: K, payload: M[K]["input"]) => Promise<M[K]["output"]>;
}

export function createClient<M extends BridgeMap>(options: ClientOptions = {}): Client<M> {
	const ns = options.namespace ?? "default";
	const timeoutMs = options.timeoutMs ?? 5000;

	return {
		send: <K extends keyof M>(type: K, payload: M[K]["input"]) =>
			new Promise<M[K]["output"]>((resolve, reject) => {
				const id = newId();

				const timer = setTimeout(() => {
					window.removeEventListener("message", onReply);
					reject(new ContentBridgeError(`mv3-content-bridge: timed out after ${timeoutMs}ms (${String(type)})`));
				}, timeoutMs);

				const onReply = (event: MessageEvent) => {
					if (event.source !== window) return;
					const data = event.data;
					if (!isReply(data) || data.ns !== ns || data.id !== id) return;
					clearTimeout(timer);
					window.removeEventListener("message", onReply);
					if (data.ok) {
						resolve(data.data as M[K]["output"]);
					} else {
						reject(new ContentBridgeError(data.error.message, data.error));
					}
				};

				window.addEventListener("message", onReply);

				const request: RequestEnvelope<string, M[K]["input"]> = {
					__mv3cb: MARKER,
					kind: "request",
					ns,
					id,
					type: type as string,
					payload,
				};
				window.postMessage(request, "*");
			}),
	};
}

function newId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `mv3cb-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
