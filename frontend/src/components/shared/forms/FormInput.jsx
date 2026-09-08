import { forwardRef } from "react";

export const FormInput = forwardRef(({ label, error, ...props }, ref) => (
  <label className="form-field">
    <span>{label}</span>
    <input ref={ref} aria-invalid={Boolean(error)} {...props} />
    {error ? <small>{error}</small> : null}
  </label>
));

FormInput.displayName = "FormInput";
