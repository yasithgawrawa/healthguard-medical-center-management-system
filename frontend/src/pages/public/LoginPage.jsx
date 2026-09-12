import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ShieldPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormInput } from "../../components/shared/forms/FormInput.jsx";
import { SubmitButton } from "../../components/shared/forms/SubmitButton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DASHBOARD_PATH_BY_ROLE } from "../../utils/roles.js";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

const QUICK_ACCESS_ROLES = [
  { roleKey: "admin", label: "Admin", email: "admin@healthguard.com", password: "Pass@12345" },
  { roleKey: "manager", label: "Manager", email: "manager@healthguard.com", password: "Pass@12345" },
  { roleKey: "doctor", label: "Doctor", email: "doctor@healthguard.com", password: "Pass@12345" },
  { roleKey: "nurse", label: "Nurse (Triage)", email: "nurse@healthguard.com", password: "Pass@12345" },
  { roleKey: "nurse2", label: "Nurse (Ward)", email: "nurse2@healthguard.com", password: "Pass@12345" },
  { roleKey: "pharmacist", label: "Pharmacist", email: "pharmacist@healthguard.com", password: "Pass@12345" },
  { roleKey: "cashier", label: "Cashier", email: "cashier@healthguard.com", password: "Pass@12345" },
  { roleKey: "lab", label: "Lab MLT", email: "lab@healthguard.com", password: "Pass@12345" },
  { roleKey: "patient", label: "Patient", email: "saman.kumara82@gmail.com", password: "Pass@12345" }
];

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState("");
  const [activeQuickKey, setActiveQuickKey] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema), mode: "onChange" });

  const onSubmit = async (values) => {
    setApiError("");
    try {
      const user = await login(values);
      navigate(location.state?.from?.pathname || DASHBOARD_PATH_BY_ROLE[user.role] || "/", { replace: true });
    } catch (error) {
      setApiError(error.response?.data?.message || "Login failed. Please check your credentials.");
      setActiveQuickKey(null);
    }
  };

  const handleQuickLogin = async (acc) => {
    setActiveQuickKey(acc.label);
    setValue("email", acc.email, { shouldValidate: true, shouldDirty: true });
    setValue("password", acc.password, { shouldValidate: true, shouldDirty: true });
    await onSubmit({ email: acc.email, password: acc.password });
  };

  return (
    <section className="auth-page">
      <div className="auth-card" style={{ maxWidth: "520px" }}>
        <div className="auth-header">
          <div className="auth-header-icon">
            <ShieldPlus size={28} />
          </div>
          <h1>Health Guard Portal</h1>
          <p>Sign in to access your clinical workflows, patient records, or health portal</p>
        </div>

        {apiError ? (
          <div className="form-alert">
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormInput
            label="Email Address"
            type="email"
            placeholder="name@healthguard.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <FormInput
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <SubmitButton isSubmitting={isSubmitting}>
            {activeQuickKey ? `Signing in as ${activeQuickKey}...` : "Sign In"}
          </SubmitButton>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Access (1-Click)
            </span>
            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
              Password: <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>Pass@12345</strong>
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
            {QUICK_ACCESS_ROLES.map((acc) => {
              const isLoading = isSubmitting && activeQuickKey === acc.label;

              return (
                <button
                  key={acc.roleKey}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickLogin(acc)}
                  style={{
                    padding: "6px 12px",
                    background: isLoading ? "#0284c7" : "#f1f5f9",
                    border: isLoading ? "1px solid #0284c7" : "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: isLoading ? "#ffffff" : "#334155",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && !isLoading) {
                      e.currentTarget.style.borderColor = "#0284c7";
                      e.currentTarget.style.color = "#0284c7";
                      e.currentTarget.style.background = "#e0f2fe";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && !isLoading) {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.color = "#334155";
                      e.currentTarget.style.background = "#f1f5f9";
                    }
                  }}
                >
                  {isLoading ? "Signing in..." : acc.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="auth-footer">
          <p>
            New patient? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  );
};
