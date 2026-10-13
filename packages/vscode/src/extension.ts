import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "mmdFlowchart.editor",
      new MmdEditorProvider(context.extensionUri),
    ),
  );
}

/** Berichten van de editor; zie src/lib/host/host.ts in de root. */
type EditorMessage =
  | { type: "ready" }
  | { type: "change"; text: string }
  | { type: "export"; fileName: string; base64: string };

class MmdEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel,
  ) {
    const webviewRoot = vscode.Uri.joinPath(this.extensionUri, "webview");
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [webviewRoot],
    };
    panel.webview.html = renderHtml(panel.webview, webviewRoot);

    const sendLoad = () =>
      panel.webview.postMessage({
        type: "load",
        fileName: path.basename(document.fileName),
        text: document.getText(),
        theme: currentTheme(),
      });

    panel.webview.onDidReceiveMessage((message: EditorMessage) => {
      if (message.type === "ready") sendLoad();
      if (message.type === "change") void replaceText(document, message.text);
      if (message.type === "export") void exportImage(document, message);
    });

    // Wijzigingen buiten de editor (teksteditor, git, undo) doorgeven. De
    // editor negeert tekst die hij zelf al heeft.
    const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) sendLoad();
    });
    const themeSubscription = vscode.window.onDidChangeActiveColorTheme(sendLoad);

    panel.onDidDispose(() => {
      changeSubscription.dispose();
      themeSubscription.dispose();
    });
  }
}

/** Vervangt de hele inhoud van het document. Het opslaan doet VS Code. */
async function replaceText(document: vscode.TextDocument, text: string) {
  if (document.getText() === text) return;
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
  edit.replace(document.uri, fullRange, text);
  await vscode.workspace.applyEdit(edit);
}

async function exportImage(
  document: vscode.TextDocument,
  message: { fileName: string; base64: string },
) {
  const target = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.joinPath(document.uri, "..", message.fileName),
  });
  if (!target) return;
  await vscode.workspace.fs.writeFile(target, Buffer.from(message.base64, "base64"));
}

function currentTheme(): "light" | "dark" {
  const kind = vscode.window.activeColorTheme.kind;
  return kind === vscode.ColorThemeKind.Dark ||
    kind === vscode.ColorThemeKind.HighContrast
    ? "dark"
    : "light";
}

/** Laadt de Vite-build en zet de relatieve asset-paden om naar webview-URL's. */
function renderHtml(webview: vscode.Webview, webviewRoot: vscode.Uri): string {
  const indexPath = vscode.Uri.joinPath(webviewRoot, "index.html").fsPath;
  const baseUri = webview.asWebviewUri(webviewRoot).toString();
  const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} data: blob:`,
    `font-src ${webview.cspSource}`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src ${webview.cspSource}`,
  ].join("; ");

  return fs
    .readFileSync(indexPath, "utf8")
    .replace(/(src|href)="\.\//g, `$1="${baseUri}/`)
    .replace(
      "<head>",
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`,
    );
}
