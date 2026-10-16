import { forwardRef } from "react";

// Shared Form Textarea | Frontend Logic | Render a reusable textarea with a forwarded ref and field validation feedback.
export const FormTextarea = forwardRef(({ label, error, rows = 3, placeholder, onChange, ...props }, ref) => {
  return (
    <label className={`form-field${error ? " has-error" : ""}`}>
      <span>{label}</span>
      <textarea
        ref={ref}
        aria-invalid={Boolean(error)}
        rows={rows}
        placeholder={placeholder || `Enter ${String(label).toLowerCase()}`}
        onChange={onChange}
        {...props}
      />
      {error ? <small>{error}</small> : null}
    </label>
  );
});

FormTextarea.displayName = "FormTextarea";
