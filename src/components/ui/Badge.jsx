export function statusTone(status) {
  if (!status) return "neutral";
  const map = {
    // Payment statuses
    paid: "success",
    refunded: "special",
    held: "warning",
    unpaid: "warning",
    cancelled: "danger",
    // Kitchen / order statuses
    available: "success",
    active: "success",
    in_stock: "success",
    received: "success",
    ready: "success",
    served: "neutral",
    completed: "success",
    occupied: "special", // Distinct from danger for table states
    critical: "danger",
    blocked: "danger",
    low: "warning",
    reserved: "warning",
    preparing: "info",
    delayed: "danger",
    sent: "warning",
    on_leave: "warning",
    cleaning: "warning",
    draft: "neutral",
    vacant: "neutral",
    new: "neutral",
    out_of_stock: "danger",
  };
  return map[status.toLowerCase()] || "neutral";
}

export default function Badge({ children, status, tone, dot = false, className = "" }) {
  const finalTone = statusTone(status || tone);
  
  return (
    <span
      className={`status-badge status-${finalTone} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}
