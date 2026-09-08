import { forwardRef } from "react";

export const FormInput = forwardRef(({ label, error, sanitize, onChange, ...props }, ref) => {
  const inputType = props.type || "text";
  const placeholder = props.placeholder ?? (["date", "datetime-local", "month", "time"].includes(inputType) ? undefined : `Enter ${String(label).toLowerCase()}`);
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
  <label className={`form-field${error ? " has-error" : ""}`}>
    <span>{label}</span>
    <input ref={ref} aria-invalid={Boolean(error)} {...props} placeholder={placeholder} onChange={handleChange} />
    {error ? <small>{error}</small> : null}
  </label>
  );
});

FormInput.displayName = "FormInput";
