const VARIANTS = {
  primary: "bg-paprika-500 text-white hover:bg-paprika-600 shadow-soft",
  secondary: "bg-white text-ink-800 border border-canvas-200 hover:bg-canvas-100",
  ghost: "text-ink-600 hover:bg-canvas-100",
  danger: "bg-white text-paprika-600 border border-paprika-100 hover:bg-paprika-50",
  dark: "bg-ink-900 text-white hover:bg-ink-800",
};

const SIZES = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5",
  md: "text-sm px-3.5 py-2 gap-2",
  lg: "text-sm px-5 py-2.5 gap-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  );
}
