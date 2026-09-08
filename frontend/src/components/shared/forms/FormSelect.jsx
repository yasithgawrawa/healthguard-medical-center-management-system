import { forwardRef } from "react";

export const FormSelect = forwardRef(({ label, error, children, ...props }, ref) => (
  <label className="form-field">
    <span>{label}</span>
    <select ref={ref} aria-invalid={Boolean(error)} {...props}>
      {children}
    </select>
    {error ? <small>{error}</small> : null}
  </label>
));

FormSelect.displayName = "FormSelect";
