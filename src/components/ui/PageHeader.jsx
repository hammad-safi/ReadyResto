export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        {eyebrow && (
          <span className="font-mono text-[11px] tracking-widest text-paprika-600 uppercase">{eyebrow}</span>
        )}
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 mt-0.5">{title}</h1>
        {description && <p className="text-sm text-ink-500 mt-1 max-w-xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
