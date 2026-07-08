/**
 * VSCode extension host for the MMD Flowchart Editor.
 *
 * `.mmd` files open in a CustomTextEditor: the visual editor (the existing
 * React app, built by Vite into `media/webview/`) renders the document in
 * a webview. VSCode owns the file entirely — buffer, dirty state, save
 * (manual or auto-save), hot exit, and text-level undo. The webview only
 * exchanges *content*:
 *
 *   webview "mmd-edit"  → full-document WorkspaceEdit on the TextDocument
 *   onDidChangeTextDocument (external edit, text undo, git checkout)
 *                       → "mmd-document" push back into the webview
 *
 * Echo suppression: the change event caused by our own WorkspaceEdit is
 * consumed once and not echoed back (the webview state already matches).
 *
 * Message types live in ../../src/lib/host/protocol.ts (shared with the
 * webview app and mirrored by the IntelliJ plugin).
 */

import * as vscode from "vscode";
import type { HostToWebview, WebviewToHost } from "../../src/lib/host/protocol";

const VIEW_TYPE = "mmdFlowchart.editor";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      VIEW_TYPE,
      new MmdEditorProvider(context),
      {
        webviewOptions: {
          // The canvas holds view state (zoom, selection); keep it alive
          // when the user switches tabs.
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      },
    ),
    // Convenience entry point: the custom editor is registered with
    // priority "option" (it never claims .mmd automatically, so plain
    // text, git diffs, and other Mermaid extensions keep working); this
    // command is the one-click path from the Explorer context menu.
    vscode.commands.registerCommand(
      "mmdFlowchart.openWith",
      (uri?: vscode.Uri) => {
        const target = uri ?? vscode.window.activeTextEditor?.document.uri;
        if (!target) return;
        void vscode.commands.executeCommand("vscode.openWith", target, VIEW_TYPE);
      },
    ),
  );
}

export function deactivate(): void {
  // Subscriptions are disposed by VSCode via context.subscriptions.
}

class MmdEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };
    panel.webview.html = buildHtml(this.context, panel.webview);

    // Text we expect to see in the next change event because we applied it
    // ourselves; consumed once so a later undo *back to* this text still
    // reaches the webview.
    let expectedEchoText: string | null = null;

    const post = (msg: HostToWebview) => void panel.webview.postMessage(msg);
    const sendDocument = () =>
      post({
        type: "mmd-document",
        fileName: document.uri.path.split("/").pop() ?? document.uri.path,
        text: document.getText(),
      });

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) return;
      if (e.contentChanges.length === 0) return;
      if (expectedEchoText !== null && e.document.getText() === expectedEchoText) {
        expectedEchoText = null; // our own edit — consume, don't echo
        return;
      }
      expectedEchoText = null;
      sendDocument();
    });

    panel.webview.onDidReceiveMessage(async (msg: WebviewToHost) => {
      switch (msg.type) {
        case "mmd-ready": {
          sendDocument();
          return;
        }

        case "mmd-edit": {
          if (msg.text === document.getText()) return;
          expectedEchoText = msg.text;
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            msg.text,
          );
          const applied = await vscode.workspace.applyEdit(edit);
          if (!applied) {
            // Edit was rejected — resync the webview with reality.
            expectedEchoText = null;
            sendDocument();
          }
          return;
        }

        case "mmd-save": {
          await document.save();
          return;
        }

        case "mmd-export": {
          const target = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.joinPath(
              document.uri.with({ path: dirOf(document.uri.path) }),
              msg.fileName,
            ),
            filters: msg.fileName.toLowerCase().endsWith(".svg")
              ? { "SVG-afbeelding": ["svg"] }
              : { "PNG-afbeelding": ["png"] },
          });
          if (!target) return;
          await vscode.workspace.fs.writeFile(target, decodeDataUrl(msg.dataUrl));
          return;
        }
      }
    });

    panel.onDidDispose(() => changeSub.dispose());
  }
}

function dirOf(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx > 0 ? path.substring(0, idx) : "/";
}

/** Decode a data URL to bytes. Handles both base64 payloads (toPng) and
 *  percent-encoded UTF-8 payloads (toSvg). */
function decodeDataUrl(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Ongeldige data-URL.");
  const header = dataUrl.substring(0, comma);
  const payload = dataUrl.substring(comma + 1);
  if (header.includes(";base64")) {
    return new Uint8Array(Buffer.from(payload, "base64"));
  }
  return new TextEncoder().encode(decodeURIComponent(payload));
}

function buildHtml(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
): string {
  const assetUri = (...parts: string[]) =>
    webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "media", "webview", ...parts),
    );
  const nonce = makeNonce();
  const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} data: blob:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `font-src ${webview.cspSource} data:`,
    // html-to-image fetches stylesheets/fonts to inline them at export.
    `connect-src ${webview.cspSource} data:`,
    `script-src 'nonce-${nonce}'`,
  ].join("; ");

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MMD Flowchart</title>
    <link rel="stylesheet" href="${assetUri("assets", "index.css")}" />
    <style>html, body, #root { height: 100%; margin: 0; }</style>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" type="module" src="${assetUri("assets", "index.js")}"></script>
  </body>
</html>`;
}

function makeNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}
