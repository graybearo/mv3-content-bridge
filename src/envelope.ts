export const MARKER = "__mv3cb__";

export interface RequestEnvelope<T extends string = string, P = unknown> {
	__mv3cb: typeof MARKER;
	kind: "request";
	ns: string;
	id: string;
	type: T;
	payload: P;
}

export type ReplyEnvelope<R = unknown> =
	| {
			__mv3cb: typeof MARKER;
			kind: "reply";
			ns: string;
			id: string;
			ok: true;
			data: R;
	  }
	| {
			__mv3cb: typeof MARKER;
			kind: "reply";
			ns: string;
			id: string;
			ok: false;
			error: { name: string; message: string; stack?: string };
	  };

export function isRequest(v: unknown): v is RequestEnvelope {
	return (
		typeof v === "object" &&
		v !== null &&
		(v as { __mv3cb?: unknown }).__mv3cb === MARKER &&
		(v as { kind?: unknown }).kind === "request"
	);
}

export function isReply(v: unknown): v is ReplyEnvelope {
	return (
		typeof v === "object" &&
		v !== null &&
		(v as { __mv3cb?: unknown }).__mv3cb === MARKER &&
		(v as { kind?: unknown }).kind === "reply"
	);
}

export function serializeError(err: unknown): { name: string; message: string; stack?: string } {
	if (err instanceof Error) {
		return { name: err.name, message: err.message, stack: err.stack };
	}
	return { name: "Error", message: String(err) };
}
