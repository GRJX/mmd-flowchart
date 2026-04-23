import { create } from "zustand";

/**
 * Tijdelijke meldingen (FO §12). Elk toast-bericht verdwijnt na
 * `duration` ms; zonder duration blijft hij staan tot hij actief gesloten
 * wordt (gebruikt voor confirmation-prompts).
 */

export type ToastKind = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  /** ms; null/undefined = sticky. */
  duration?: number | null;
  /** Optionele actie-knop in de toast (bijv. "Herladen"). */
  action?: { label: string; onClick: () => void };
  /** Meerdere acties naast elkaar — `action` wordt genegeerd als dit gezet is. */
  actions?: Array<{ label: string; onClick: () => void }>;
}

const DEFAULT_DURATION_MS = 4000;

interface ToastState {
  toasts: Toast[];
  show: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (t) => {
    const id = `t${nextId++}`;
    const toast: Toast = { id, duration: DEFAULT_DURATION_MS, ...t };
    set({ toasts: [...get().toasts, toast] });
    if (toast.duration !== null && toast.duration !== undefined) {
      window.setTimeout(() => get().dismiss(id), toast.duration);
    }
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  clear: () => set({ toasts: [] }),
}));

export const showToast = (args: Omit<Toast, "id">) =>
  useToastStore.getState().show(args);
