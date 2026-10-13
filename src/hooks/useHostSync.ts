import { useEffect } from "react";
import { onLoad, sendToHost, isInIde } from "@/lib/host/host";
import { loadText } from "@/lib/host/document";
import { applyTheme, systemTheme } from "@/lib/host/theme";
import { serializeMmd } from "@/lib/mermaid/serialize";
import { useDiagramStore } from "@/store/diagramStore";
import { HOST_SYNC_DEBOUNCE_MS } from "@/types/domain";

/**
 * Houdt de editor en het document in de IDE gelijk:
 * - een `load` van de IDE laadt de tekst in de editor;
 * - wijzigingen in de editor gaan (kort vertraagd) als `change` naar de IDE.
 *
 * `lastText` is de tekst waarvan we weten dat editor en IDE die allebei
 * hebben. Zo sturen we een `load` die alleen onze eigen wijziging
 * terugkaatst niet opnieuw de editor in.
 */
export function useHostSync(): void {
  useEffect(() => {
    let lastText: string | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const stopLoad = onLoad((message) => {
      applyTheme(message.theme);
      if (message.text === lastText) return;
      lastText = message.text;
      loadText(message.fileName, message.text);
    });

    const sendChange = () => {
      timeout = null;
      const { diagram, readOnlyReason, markSaved } = useDiagramStore.getState();
      if (readOnlyReason) return;
      const text = serializeMmd(diagram);
      markSaved(Date.now());
      if (text === lastText) return;
      lastText = text;
      sendToHost({ type: "change", text });
    };

    const stopSubscribe = useDiagramStore.subscribe((state, prev) => {
      if (state.diagram === prev.diagram || !state.isDirty) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(sendChange, HOST_SYNC_DEBOUNCE_MS);
    });

    if (isInIde()) {
      sendToHost({ type: "ready" });
    } else {
      // `npm run dev`: geen IDE, dus een leeg voorbeeldbestand.
      applyTheme(systemTheme());
      loadText("voorbeeld.mmd", "");
    }

    return () => {
      stopLoad();
      stopSubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, []);
}
