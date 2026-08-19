import React from 'react';

/**
 * A standard date picker that inherits the dark mode color-scheme fixes
 * from index.css.
 */
export default function DatePicker({ className = '', ...props }) {
  return (
    <input 
      type="date" 
      className={`font-mono ${className}`}
      {...props} 
    />
  );
}
