const TONES = {
  neutral: "bg-canvas-200 text-ink-700",
  success: "bg-basil-500/10 text-basil-600",
  warning: "bg-saffron-400/15 text-saffron-500",
  danger: "bg-paprika-500/10 text-paprika-600",
  info: "bg-slateblue-500/10 text-slateblue-500",
};

export default function Badge({ children, tone = "neutral", dot = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone] || TONES.neutral}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function statusTone(status) {
  const map = {
    available: "success",
    active: "success",
    in_stock: "success",
    received: "success",
    ready: "success",
    served: "info",
    occupied: "danger",
    critical: "danger",
    cancelled: "danger",
    blocked: "danger",
    low: "warning",
    reserved: "warning",
    preparing: "warning",
    sent: "warning",
    on_leave: "warning",
    cleaning: "neutral",
    draft: "neutral",
    new: "info",
    out_of_stock: "danger",
  };
  return map[status] || "neutral";
}
