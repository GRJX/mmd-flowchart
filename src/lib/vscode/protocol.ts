/**
 * Wire types between the webview UI and the VSCode extension host. This
 * file is imported by both the Vite app (src/) and the extension
 * (vscode-extension/src/) — keep it free of DOM and vscode imports.
 *
 * The model is deliberately minimal: VSCode owns the `.mmd` document
 * (buffer, dirty state, save settings, hot exit, text undo). The webview
 * renders and edits the *content*; every canvas mutation is pushed as the
 * full serialized text, and every document change (external edit, text
 * undo, git checkout) is pushed back as the full text. All messages are
 * fire-and-forget — there is no request/response machinery.
 */

/** Webview → extension host. */
export type WebviewToHost =
  /** Message listener attached; send the initial document. */
  | { type: "mmd-ready" }
  /** Replace the document's content with this serialized diagram. */
  | { type: "mmd-edit"; text: string }
  /** Persist the document (explicit Ctrl/Cmd+S in the canvas). */
  | { type: "mmd-save" }
  /** Save an exported PNG/SVG via the host's save dialog. */
  | { type: "mmd-export"; fileName: string; dataUrl: string };

/** Extension host → webview. */
export type HostToWebview =
  /** Initial content or an external change: (re)load this text. */
  | { type: "mmd-document"; fileName: string; text: string };
