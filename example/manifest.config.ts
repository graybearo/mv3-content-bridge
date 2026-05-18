import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
	manifest_version: 3,
	name: "mv3-content-bridge example",
	version: "0.0.1",
	description: "Demo showing a typed bridge between content script (ISOLATED) and page (MAIN) world.",
	action: {
		default_popup: "src/popup/index.html",
		default_title: "mv3-content-bridge demo",
	},
	content_scripts: [
		{
			matches: ["https://*/*"],
			js: ["src/content.ts"],
			run_at: "document_idle",
		},
		{
			matches: ["https://*/*"],
			js: ["src/page.ts"],
			run_at: "document_start",
			world: "MAIN",
		},
	],
});
