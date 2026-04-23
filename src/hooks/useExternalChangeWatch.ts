import { useEffect } from "react";
import { checkForExternalChange } from "@/lib/fs/fileOps";

/**
 * Controleert bij tab-refocus (focus of `visibilitychange`) of het huidige
 * bestand op schijf nieuwer is dan wat we lokaal geladen hebben. Zo ja,
 * toont de helper een toast met een Herladen-actie. Wijzigingen tijdens
 * het schrijven zelf worden aan de save-path gedetecteerd.
 */
export function useExternalChangeWatch() {
  useEffect(() => {
    const onFocus = () => void checkForExternalChange();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkForExternalChange();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
