import { forwardRef } from "react";

// Shared Form Input | Frontend Logic | Render a reusable input with its label, field error, ref, and optional value sanitization.
export const FormInput = forwardRef(({
  label,
  error,
  sanitize,
  onChange,
  required,
  containerClassName = "",
  containerStyle,
  ...props
}, ref) => {
  const inputType = props.type || "text";
  const placeholder = props.placeholder ?? (["date", "datetime-local", "month", "time"].includes(inputType) ? undefined : `Enter ${String(label).toLowerCase()}`);

  // Shared Form Input | Frontend Logic | Sanitize the input value when requested and forward the change to the registered form handler.
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
    <label
      className={`form-field${error ? " has-error" : ""} ${containerClassName}`.trim()}
      style={containerStyle}
    >
      <span>
        {label}
        {required && <span style={{ color: "var(--danger, #e11d48)", marginLeft: "3px" }}>*</span>}
      </span>
      <input ref={ref} aria-invalid={Boolean(error)} {...props} placeholder={placeholder} onChange={handleChange} />
      {error ? <small>{error}</small> : null}
    </label>
  );
});

FormInput.displayName = "FormInput";
