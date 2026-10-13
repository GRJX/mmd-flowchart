import { ReactFlowProvider } from "@xyflow/react";
import { AppShell } from "@/shell/AppShell";
import { Toolbar } from "@/shell/Toolbar";
import { Canvas } from "@/canvas/Canvas";
import { RightPanel } from "@/panel/RightPanel";
import { Toasts } from "@/shell/Toasts";
import { useHostSync } from "@/hooks/useHostSync";
import { useShortcuts } from "@/hooks/useShortcuts";

export function App() {
  return (
    <ReactFlowProvider>
      <InnerApp />
    </ReactFlowProvider>
  );
}

function InnerApp() {
  useHostSync();
  useShortcuts();
  return (
    <>
      <AppShell
        toolbar={<Toolbar />}
        canvas={<Canvas />}
        rightPanel={<RightPanel />}
      />
      <Toasts />
    </>
  );
}
