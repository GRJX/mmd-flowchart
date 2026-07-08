import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { AppShell } from "@/shell/AppShell";
import { Toolbar } from "@/shell/Toolbar";
import { Canvas } from "@/canvas/Canvas";
import { RightPanel } from "@/panel/RightPanel";
import { Sidebar } from "@/sidebar/Sidebar";
import { NewDiagramDialog } from "@/sidebar/NewDiagramDialog";
import { Toasts } from "@/shell/Toasts";
import { restoreRootFolder } from "@/lib/fs/fileOps";
import { initVsCodeBridge, isVsCodeWebview } from "@/lib/vscode/bridge";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useExternalChangeWatch } from "@/hooks/useExternalChangeWatch";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useTheme } from "@/hooks/useTheme";

export function App() {
  useEffect(() => {
    // In VSCode the extension host pushes the document into the webview;
    // in the browser we restore the previously opened folder.
    if (isVsCodeWebview()) initVsCodeBridge();
    else void restoreRootFolder();
  }, []);

  // Applies the theme class on mount so every reload starts in the right
  // colors even before anything interacts with the toggle.
  useTheme();

  return (
    <ReactFlowProvider>
      <InnerApp />
    </ReactFlowProvider>
  );
}

function InnerApp() {
  useAutoSave();
  useShortcuts();
  useExternalChangeWatch();
  // Single-document mode inside VSCode: the Explorer is the file tree, so
  // the sidebar and new-diagram dialog have no role there.
  const vscodeMode = isVsCodeWebview();
  return (
    <>
      <AppShell
        toolbar={<Toolbar />}
        sidebar={vscodeMode ? null : <Sidebar />}
        canvas={<Canvas />}
        rightPanel={<RightPanel />}
      />
      {!vscodeMode && <NewDiagramDialog />}
      <Toasts />
    </>
  );
}
