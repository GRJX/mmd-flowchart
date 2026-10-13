/**
 * Koppeling met de IDE waarin de editor draait (VS Code-webview of IntelliJ JCEF).
 *
 * IDE → editor: de IDE stuurt een `load`-bericht met `window.postMessage`,
 * bij openen én bij elke wijziging van het bestand buiten de editor.
 * Editor → IDE: VS Code via `acquireVsCodeApi()`, IntelliJ via de functie
 * `window.mmdHost` die de plugin injecteert. Zonder IDE (`npm run dev`)
 * worden berichten alleen gelogd.
 */

export type Theme = "light" | "dark";

export interface LoadMessage {
  type: "load";
  fileName: string;
  text: string;
  theme: Theme;
}

export type EditorMessage =
  | { type: "ready" }
  | { type: "change"; text: string }
  | { type: "export"; fileName: string; base64: string };

declare global {
  interface Window {
    acquireVsCodeApi?: () => { postMessage(message: unknown): void };
    mmdHost?: (json: string) => void;
  }
}

const vscode = window.acquireVsCodeApi?.();

export function isInIde(): boolean {
  return Boolean(vscode || window.mmdHost);
}

export function sendToHost(message: EditorMessage): void {
  if (vscode) vscode.postMessage(message);
  else if (window.mmdHost) window.mmdHost(JSON.stringify(message));
  else console.info("[host]", message);
}

// De listener staat direct bij het laden van de module, zodat een bericht
// dat binnenkomt vóórdat React gestart is niet verloren gaat.
let lastLoad: LoadMessage | null = null;
const handlers = new Set<(message: LoadMessage) => void>();

window.addEventListener("message", (event: MessageEvent) => {
  if (event.data?.type !== "load") return;
  lastLoad = event.data as LoadMessage;
  handlers.forEach((handler) => handler(lastLoad!));
});

/** Roept `handler` aan voor elk `load`-bericht, ook een eerder ontvangen. */
export function onLoad(handler: (message: LoadMessage) => void): () => void {
  if (lastLoad) handler(lastLoad);
  handlers.add(handler);
  return () => handlers.delete(handler);
}
