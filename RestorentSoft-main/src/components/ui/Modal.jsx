import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, footer, width = "max-w-lg", onSubmit }) {
  if (!open) return null;
  const Container = onSubmit ? "form" : "div";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <Container 
        onSubmit={onSubmit ? (e) => { e.preventDefault(); onSubmit(e); } : undefined}
        className={`relative w-full ${width} bg-[rgb(var(--surface-card))] border border-canvas-200 rounded-xl2 shadow-card max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-canvas-200 shrink-0">
          <h3 className="font-display font-semibold text-ink-900">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-canvas-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-canvas-200 flex justify-end gap-2 shrink-0">{footer}</div>}
      </Container>
    </div>
  );
}
