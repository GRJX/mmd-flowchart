/**
 * Webview side of the host-IDE integration. Inside a host IDE (VSCode or
 * IntelliJ) the app runs in single-document mode: the sidebar/file tree is
 * hidden, all file lifecycle (open/save/dirty/undo-on-text) belongs to the
 * IDE, and this bridge keeps the canvas and the IDE's document in sync:
 *
 *   canvas mutation ──(debounced, useAutoSave)──► pushDocumentEdit ──► host
 *   host document change (external edit, text undo) ──► loadDiagramContent
 *
 * Echo suppression happens on both sides: the host skips the change event
 * caused by our own edit, and we skip document pushes whose text equals
 * what we last saw.
 *
 * Two transports are supported, detected at runtime:
 * - **VSCode**: `acquireVsCodeApi()` + window "message" events.
 * - **IntelliJ (JCEF)**: the plugin injects `window.__mmdHost` (with a
 *   `postMessage(jsonString)` backed by a JBCefJSQuery) *before* the app
 *   bundle loads, and delivers host→webview messages by calling
 *   `window.__mmdHostReceive(<json>)`.
 */

import { serializeMmd } from "@/lib/mermaid/serialize";
import { loadDiagramContent } from "@/lib/fs/fileOps";
import { useDiagramStore } from "@/store/diagramStore";
import type { HostToWebview, WebviewToHost } from "./protocol";

interface VsCodeApi {
  postMessage(msg: unknown): void;
}

interface JcefHost {
  postMessage(json: string): void;
}

interface HostGlobals {
  acquireVsCodeApi?: () => VsCodeApi;
  __mmdHost?: JcefHost;
  __mmdHostReceive?: (msg: unknown) => void;
}

const g = globalThis as HostGlobals;

/** True when the app runs embedded in a host IDE (VSCode or IntelliJ). */
export function isEmbeddedHost(): boolean {
  return typeof g.acquireVsCodeApi === "function" || Boolean(g.__mmdHost);
}

interface Transport {
  post(msg: WebviewToHost): void;
}

let transport: Transport | null = null;
/** The document text as last exchanged with the host, in either direction. */
let lastDocText: string | null = null;

function post(msg: WebviewToHost): void {
  transport?.post(msg);
}

function onHostMessage(raw: unknown): void {
  // JCEF delivers JSON strings; VSCode delivers structured clones.
  const msg = (typeof raw === "string" ? JSON.parse(raw) : raw) as
    | HostToWebview
    | undefined;
  if (!msg || msg.type !== "mmd-document") return;
  if (msg.text === lastDocText) return; // our own edit echoed back
  lastDocText = msg.text;
  loadDiagramContent({
    path: msg.fileName,
    fileName: msg.fileName,
    content: msg.text,
    lastModified: Date.now(),
  });
}

export function initHostBridge(): void {
  if (transport) return;

  if (typeof g.acquireVsCodeApi === "function") {
    const api = g.acquireVsCodeApi(); // may only be called once
    transport = { post: (msg) => api.postMessage(msg) };
    window.addEventListener("message", (event: MessageEvent) =>
      onHostMessage(event.data),
    );
  } else if (g.__mmdHost) {
    const host = g.__mmdHost;
    transport = { post: (msg) => host.postMessage(JSON.stringify(msg)) };
    g.__mmdHostReceive = onHostMessage;
  } else {
    return; // plain browser — nothing to bridge
  }

  post({ type: "mmd-ready" });
}

/** Serialize the current diagram and sync it into the host's document. The
 *  document becomes dirty in the IDE; actual disk writes follow the user's
 *  own save settings (auto-save or manual). */
export function pushDocumentEdit(): void {
  if (!transport) return;
  const store = useDiagramStore.getState();
  if (store.readOnlyReason !== null || store.filePath === null) return;
  const text = serializeMmd(store.diagram);
  if (text === lastDocText) return;
  lastDocText = text;
  post({ type: "mmd-edit", text });
  // From the app's perspective the change is handed off; the IDE's tab
  // dirty indicator is the real save state from here on.
  store.markSaved(Date.now());
}

/** Explicit save (Ctrl/Cmd+S): sync the buffer, then ask the IDE to save. */
export function requestDocumentSave(): void {
  pushDocumentEdit();
  post({ type: "mmd-save" });
}

/** Route an exported image through the host's native save dialog. */
export function saveExportViaHost(fileName: string, dataUrl: string): void {
  post({ type: "mmd-export", fileName, dataUrl });
}
