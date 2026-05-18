export type BridgeMap = Record<string, { input: unknown; output: unknown }>;

export type Handler<M extends BridgeMap, K extends keyof M> = (
	payload: M[K]["input"],
) => M[K]["output"] | Promise<M[K]["output"]>;

export type Handlers<M extends BridgeMap> = {
	[K in keyof M]?: Handler<M, K>;
};

export class ContentBridgeError extends Error {
	override readonly name = "ContentBridgeError";
	constructor(
		message: string,
		override readonly cause?: { name: string; message: string; stack?: string },
	) {
		super(message);
	}
}
