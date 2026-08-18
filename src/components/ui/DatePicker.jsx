import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

/**
 * A styled, premium DatePicker replacing the native HTML5 <input type="date">.
 * It integrates seamlessly with the existing theme variables.
 */
export default function StyledDatePicker({ value, onChange, disabled, className, required, ...props }) {
  // Convert standard HTML5 date string (YYYY-MM-DD) to a JS Date object
  const selectedDate = value ? new Date(value + "T12:00:00") : null;

  const handleChange = (date) => {
    if (!date) {
      onChange({ target: { value: "" } });
      return;
    }
    // Format back to YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    onChange({ target: { value: `${yyyy}-${mm}-${dd}` } });
  };

  return (
    <div className={`relative ${className || ""}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-500">
        <Calendar size={16} strokeWidth={1.5} />
      </div>
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        dateFormat="MMM d, yyyy"
        className="w-full border border-canvas-200 bg-surface-input rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary-500 disabled:bg-canvas-50 disabled:text-ink-500 transition-colors placeholder:text-ink-400"
        wrapperClassName="w-full"
        showPopperArrow={false}
        {...props}
      />
    </div>
  );
}
