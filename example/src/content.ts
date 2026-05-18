import { createClient } from "mv3-content-bridge";
import type { Bridge } from "./shared/bridge";

const page = createClient<Bridge>();

const box = document.createElement("div");
Object.assign(box.style, {
	position: "fixed",
	bottom: "16px",
	right: "16px",
	zIndex: "2147483647",
	padding: "12px 14px",
	background: "#111",
	color: "#fff",
	border: "1px solid #333",
	borderRadius: "8px",
	font: "12px system-ui, sans-serif",
	maxWidth: "300px",
	boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
	lineHeight: "1.45",
});

const title = document.createElement("div");
title.textContent = "mv3-content-bridge demo";
title.style.fontWeight = "600";
title.style.marginBottom = "6px";

const isolatedRead = document.createElement("div");
isolatedRead.style.opacity = "0.7";
isolatedRead.style.fontFamily = "ui-monospace, SF Mono, Menlo, monospace";

const bridgeRead = document.createElement("div");
bridgeRead.style.marginTop = "6px";
bridgeRead.style.fontFamily = "ui-monospace, SF Mono, Menlo, monospace";

const incBtn = document.createElement("button");
incBtn.textContent = "+1 via bridge";
Object.assign(incBtn.style, {
	marginTop: "8px",
	padding: "5px 10px",
	background: "#222",
	color: "#fff",
	border: "1px solid #444",
	borderRadius: "4px",
	cursor: "pointer",
	font: "inherit",
});

box.append(title, isolatedRead, bridgeRead, incBtn);
document.body.appendChild(box);

// Prove the ISOLATED world can't see page-side globals
const fromIsolated = (window as unknown as { __demoState?: unknown }).__demoState;
isolatedRead.textContent = `ISOLATED sees __demoState = ${JSON.stringify(fromIsolated)}`;

async function refresh() {
	const state = await page.send("GET_PAGE_STATE", undefined);
	bridgeRead.textContent = `via bridge: user=${state.user}, count=${state.count}`;
}

incBtn.addEventListener("click", async () => {
	await page.send("INCREMENT_PAGE_COUNT", { by: 1 });
	await refresh();
});

void refresh();
