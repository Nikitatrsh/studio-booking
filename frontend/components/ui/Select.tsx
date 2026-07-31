import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, className = "", children, ...props },
  ref,
) {
  const selectId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        className={`rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${
          error ? "border-red-400" : "border-slate-300"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Select;
