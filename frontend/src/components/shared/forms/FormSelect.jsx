import { forwardRef } from "react";

export const FormSelect = forwardRef(({
  label,
  error,
  children,
  required,
  containerClassName = "",
  containerStyle,
  ...props
}, ref) => (
  <label
    className={`form-field${error ? " has-error" : ""} ${containerClassName}`.trim()}
    style={containerStyle}
  >
    <span>
      {label}
      {required && <span style={{ color: "var(--danger, #e11d48)", marginLeft: "3px" }}>*</span>}
    </span>
    <select ref={ref} aria-invalid={Boolean(error)} {...props}>
      {children}
    </select>
    {error ? <small>{error}</small> : null}
  </label>
));

FormSelect.displayName = "FormSelect";
