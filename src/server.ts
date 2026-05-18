import { type BridgeMap, type Handlers, type Handler } from "./types";
import { MARKER, type ReplyEnvelope, isRequest, serializeError } from "./envelope";

export interface ServeOptions {
	namespace?: string;
}

export interface ServeHandle {
	stop: () => void;
}

export function serve<M extends BridgeMap>(handlers: Handlers<M>, options: ServeOptions = {}): ServeHandle {
	const ns = options.namespace ?? "default";

	const onMessage = (event: MessageEvent) => {
		if (event.source !== window) return;
		const data = event.data;
		if (!isRequest(data) || data.ns !== ns) return;

		const handler = handlers[data.type as keyof M] as Handler<M, keyof M> | undefined;
		if (!handler) return;

		Promise.resolve()
			.then(() => handler(data.payload as M[keyof M]["input"]))
			.then((result) => {
				const reply: ReplyEnvelope = {
					__mv3cb: MARKER,
					kind: "reply",
					ns,
					id: data.id,
					ok: true,
					data: result,
				};
				window.postMessage(reply, "*");
			})
			.catch((err: unknown) => {
				const reply: ReplyEnvelope = {
					__mv3cb: MARKER,
					kind: "reply",
					ns,
					id: data.id,
					ok: false,
					error: serializeError(err),
				};
				window.postMessage(reply, "*");
			});
	};

	window.addEventListener("message", onMessage);
	return {
		stop: () => window.removeEventListener("message", onMessage),
	};
}
