import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, ShieldPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormInput } from "../../components/shared/forms/FormInput.jsx";
import { FormSelect } from "../../components/shared/forms/FormSelect.jsx";
import { SubmitButton } from "../../components/shared/forms/SubmitButton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DASHBOARD_PATH_BY_ROLE } from "../../utils/roles.js";
import { requiredName, requiredPastDate, requiredPhone, stripDigits, stripNonPhone } from "../../utils/validationSchemas.js";

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

const schema = z
  .object({
    firstName: requiredName("First name"),
    lastName: requiredName("Last name"),
    email: z
      .string({ required_error: "Email address is required" })
      .trim()
      .min(1, "Email address is required")
      .email("Please enter a valid email address (e.g. name@example.com)"),
    phone: requiredPhone,
    address: z
      .string({ required_error: "Residential address is required" })
      .trim()
      .min(1, "Residential address is required")
      .min(5, "Address must be at least 5 characters (street / city)")
      .max(250, "Address cannot exceed 250 characters"),
    dateOfBirth: requiredPastDate("Date of birth"),
    gender: z
      .string({ required_error: "Please select your gender" })
      .min(1, "Please select your gender")
      .refine(
        (val) => ["female", "male", "other", "prefer_not_to_say"].includes(val),
        "Please select a valid gender option"
      ),
    password: passwordSchema,
    confirmPassword: z
      .string({ required_error: "Please confirm your password" })
      .min(1, "Please confirm your password")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

export const RegisterPage = () => {
  const { registerPatient } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");

  const today = new Date();
  const todayDateString = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "",
      password: "",
      confirmPassword: ""
    }
  });

  const passwordValue = watch("password", "");
  const hasMinLength = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasLower = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSymbol = /[^A-Za-z0-9]/.test(passwordValue);

  const onSubmit = async (values) => {
    setApiError("");
    try {
      const user = await registerPatient(values);
      navigate(DASHBOARD_PATH_BY_ROLE[user.role] || "/patient", { replace: true });
    } catch (error) {
      setApiError(error.response?.data?.message || "Registration failed. Please check your details.");
    }
  };

  const onInvalid = (fieldErrors) => {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey) {
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    setApiError("Please correct the highlighted validation errors before submitting.");
  };

  return (
    <section className="auth-page">
      <div className="auth-card wide">
        <div className="auth-header">
          <div className="auth-header-icon">
            <ShieldPlus size={28} />
          </div>
          <h1>Patient Registration</h1>
          <p>Create your Health Guard patient portal account for appointments and medical records</p>
        </div>

        {apiError ? (
          <div className="form-alert" style={{ marginBottom: "20px" }}>
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
          <div className="form-grid">
            <FormInput
              label="First Name"
              required
              placeholder="Saman"
              sanitize={stripDigits}
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <FormInput
              label="Last Name"
              required
              placeholder="Kumara"
              sanitize={stripDigits}
              error={errors.lastName?.message}
              {...register("lastName")}
            />
            <FormInput
              label="Email Address"
              required
              type="email"
              placeholder="saman.kumara@example.lk"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormInput
              label="Phone Number"
              required
              placeholder="+94 77 123 4567"
              inputMode="tel"
              sanitize={stripNonPhone}
              error={errors.phone?.message}
              {...register("phone")}
            />
            <FormInput
              label="Date of Birth"
              required
              type="date"
              max={todayDateString}
              min="1900-01-01"
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth")}
            />
            <FormSelect
              label="Gender"
              required
              error={errors.gender?.message}
              {...register("gender")}
            >
              <option value="">Select Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </FormSelect>
            <FormInput
              label="Residential Address"
              required
              placeholder="No. 24, Galle Road, Colombo 03"
              containerStyle={{ gridColumn: "1 / -1" }}
              error={errors.address?.message}
              {...register("address")}
            />

            <FormInput
              label="Password"
              required
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <FormInput
              label="Confirm Password"
              required
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {/* Live Password Criteria Indicators */}
            {passwordValue ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "6px",
                  fontSize: "0.78rem"
                }}
              >
                <div style={{ color: hasMinLength ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={13} /> At least 8 characters
                </div>
                <div style={{ color: hasUpper ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={13} /> Uppercase letter (A-Z)
                </div>
                <div style={{ color: hasLower ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={13} /> Lowercase letter (a-z)
                </div>
                <div style={{ color: hasNumber ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={13} /> Number (0-9)
                </div>
                <div style={{ color: hasSymbol ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={13} /> Special symbol (!@#$)
                </div>
              </div>
            ) : null}
          </div>

          <SubmitButton isSubmitting={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Create Patient Account"}
          </SubmitButton>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </section>
  );
};
