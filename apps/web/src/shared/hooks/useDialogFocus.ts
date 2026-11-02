import { useEffect, useRef, useState, type RefObject } from "react";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),'
  + 'textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

// Destino del foco al pulsar Tab en un diálogo modal: envuelve del último al primero (y viceversa con Shift).
// null = dejar que el navegador mueva el foco con normalidad. Puro → testeable sin DOM.
export function focusWrapTarget<T>(items: readonly T[], active: T | null, shift: boolean): T | null {
  if (items.length === 0) return null;
  const first = items[0], last = items[items.length - 1];
  const i = active === null ? -1 : items.indexOf(active);
  if (shift) return i <= 0 ? last : null;
  return i === -1 || i === items.length - 1 ? first : null;
}

// a11y de diálogo modal (WAI-ARIA APG): al abrir mueve el foco dentro (respeta autoFocus de los hijos), Tab/Shift+Tab
// quedan atrapados, Escape cierra, y al cerrar devuelve el foco al elemento que abrió el modal.
// Listener NATIVO sobre el nodo (no onKeyDown de React: los eventos sintéticos sí burbujean a través de Portals).
export function useDialogFocus(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  // El opener se captura en el PRIMER render: el autoFocus de un hijo se aplica en el commit, antes de los efectos.
  const [opener] = useState(() => (typeof document !== "undefined" && document.activeElement instanceof HTMLElement ? document.activeElement : null));
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!node.contains(document.activeElement)) node.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      // Solo responde el modal SUPERIOR: el último [aria-modal] en orden de documento (los Portals se apilan al final
      // de <body>; un diálogo hijo va después de su contenedor). Evita que Escape en un ImageLightbox/PaymentDialog
      // abierto encima cierre también este ScreenModal.
      const modals = document.querySelectorAll('[aria-modal="true"]');
      if (modals[modals.length - 1] !== node) return;
      if (e.key === "Escape" && !e.defaultPrevented) { e.preventDefault(); close.current(); return; }
      if (e.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
      const active = document.activeElement instanceof HTMLElement && node.contains(document.activeElement) ? document.activeElement : null;
      if (items.length === 0) { e.preventDefault(); node.focus({ preventScroll: true }); return; }
      const target = focusWrapTarget(items, active === node ? null : active, e.shiftKey);
      if (target) { e.preventDefault(); target.focus(); }
    };
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
    // Solo al montar/desmontar: re-suscribir por identidad de onClose robaría/restauraría el foco en cada render
    // (el cierre vigente se lee de close.current). ref es estable.
  }, [ref, opener]);
}
