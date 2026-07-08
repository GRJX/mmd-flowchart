/**
 * Webview side of the VSCode custom-editor integration. Inside VSCode the
 * app runs in single-document mode: the sidebar/file tree is hidden, all
 * file lifecycle (open/save/dirty/undo-on-text) belongs to VSCode, and
 * this bridge keeps the canvas and the TextDocument in sync:
 *
 *   canvas mutation ──(debounced, useAutoSave)──► pushDocumentEdit ──► host
 *   host document change (external edit, text undo) ──► loadDiagramContent
 *
 * Echo suppression happens on both sides: the host skips the change event
 * caused by our own edit, and we skip document pushes whose text equals
 * what we last saw.
 */

import { serializeMmd } from "@/lib/mermaid/serialize";
import { loadDiagramContent } from "@/lib/fs/fileOps";
import { useDiagramStore } from "@/store/diagramStore";
import type { HostToWebview, WebviewToHost } from "./protocol";

interface VsCodeApi {
  postMessage(msg: unknown): void;
}

export function isVsCodeWebview(): boolean {
  return (
    typeof (globalThis as { acquireVsCodeApi?: unknown }).acquireVsCodeApi ===
    "function"
  );
}

let api: VsCodeApi | null = null;
/** The document text as last exchanged with the host, in either direction. */
let lastDocText: string | null = null;

function post(msg: WebviewToHost): void {
  api?.postMessage(msg);
}

export function initVsCodeBridge(): void {
  if (api) return; // acquireVsCodeApi may only be called once
  api = (
    globalThis as unknown as { acquireVsCodeApi: () => VsCodeApi }
  ).acquireVsCodeApi();

  window.addEventListener("message", (event: MessageEvent) => {
    const msg = event.data as HostToWebview;
    if (!msg || msg.type !== "mmd-document") return;
    if (msg.text === lastDocText) return; // our own edit echoed back
    lastDocText = msg.text;
    loadDiagramContent({
      path: msg.fileName,
      fileName: msg.fileName,
      content: msg.text,
      lastModified: Date.now(),
    });
  });

  post({ type: "mmd-ready" });
}

/** Serialize the current diagram and sync it into the TextDocument. The
 *  document becomes dirty in VSCode; actual disk writes follow the user's
 *  own save settings (auto-save or manual). */
export function pushDocumentEdit(): void {
  if (!api) return;
  const store = useDiagramStore.getState();
  if (store.readOnlyReason !== null || store.filePath === null) return;
  const text = serializeMmd(store.diagram);
  if (text === lastDocText) return;
  lastDocText = text;
  post({ type: "mmd-edit", text });
  // From the app's perspective the change is handed off; VSCode's tab
  // dirty-dot is the real save indicator from here on.
  store.markSaved(Date.now());
}

/** Explicit save (Ctrl/Cmd+S): sync the buffer, then ask VSCode to save. */
export function requestDocumentSave(): void {
  pushDocumentEdit();
  post({ type: "mmd-save" });
}

/** Route an exported image through the host's native save dialog. */
export function saveExportViaHost(fileName: string, dataUrl: string): void {
  post({ type: "mmd-export", fileName, dataUrl });
}
