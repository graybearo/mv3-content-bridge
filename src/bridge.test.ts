import { describe, it, expect } from "vitest";
import { isRequest, isReply, serializeError, MARKER, type RequestEnvelope, type ReplyEnvelope } from "./envelope";
import { ContentBridgeError } from "./types";

describe("envelope", () => {
	it("isRequest accepts tagged requests and rejects everything else", () => {
		const req: RequestEnvelope = {
			__mv3cb: MARKER,
			kind: "request",
			ns: "default",
			id: "1",
			type: "GET",
			payload: undefined,
		};
		expect(isRequest(req)).toBe(true);

		expect(isRequest({ __mv3cb: MARKER, kind: "reply", ns: "default", id: "1", ok: true, data: 0 })).toBe(false);
		expect(isRequest({ foo: "bar" })).toBe(false);
		expect(isRequest(null)).toBe(false);
		expect(isRequest("string")).toBe(false);
	});

	it("isReply accepts tagged replies", () => {
		const ok: ReplyEnvelope<number> = { __mv3cb: MARKER, kind: "reply", ns: "default", id: "1", ok: true, data: 42 };
		const err: ReplyEnvelope = {
			__mv3cb: MARKER,
			kind: "reply",
			ns: "default",
			id: "1",
			ok: false,
			error: { name: "Error", message: "x" },
		};
		expect(isReply(ok)).toBe(true);
		expect(isReply(err)).toBe(true);
		expect(isReply({ __mv3cb: MARKER, kind: "request", ns: "", id: "", type: "", payload: null })).toBe(false);
	});

	it("serializeError preserves name/message/stack for Error instances", () => {
		const e = new Error("boom");
		const s = serializeError(e);
		expect(s.name).toBe("Error");
		expect(s.message).toBe("boom");
		expect(typeof s.stack).toBe("string");
	});

	it("serializeError falls back to String() for non-Error values", () => {
		expect(serializeError("oops")).toEqual({ name: "Error", message: "oops" });
	});
});

describe("ContentBridgeError", () => {
	it("carries the original error info on .cause", () => {
		const err = new ContentBridgeError("wrapped", { name: "Inner", message: "y" });
		expect(err.name).toBe("ContentBridgeError");
		expect(err.cause).toEqual({ name: "Inner", message: "y" });
	});
});
