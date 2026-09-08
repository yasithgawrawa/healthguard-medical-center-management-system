import { forwardRef } from "react";

export const FormInput = forwardRef(({ label, error, sanitize, onChange, ...props }, ref) => {
  const handleChange = (event) => {
    if (sanitize) {
      const nextValue = sanitize(event.target.value);
      if (nextValue !== event.target.value) {
        event.target.value = nextValue;
      }
    }
    onChange?.(event);
  };

  return (
  <label className="form-field">
    <span>{label}</span>
    <input ref={ref} aria-invalid={Boolean(error)} onChange={handleChange} {...props} />
    {error ? <small>{error}</small> : null}
  </label>
  );
});

FormInput.displayName = "FormInput";
