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
import { useAutoSave } from "@/hooks/useAutoSave";
import { useExternalChangeWatch } from "@/hooks/useExternalChangeWatch";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useTheme } from "@/hooks/useTheme";

export function App() {
  useEffect(() => {
    void restoreRootFolder();
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
  return (
    <>
      <AppShell
        toolbar={<Toolbar />}
        sidebar={<Sidebar />}
        canvas={<Canvas />}
        rightPanel={<RightPanel />}
      />
      <NewDiagramDialog />
      <Toasts />
    </>
  );
}
