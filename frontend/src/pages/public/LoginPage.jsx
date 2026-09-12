import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  AlertCircle,
  Briefcase,
  CreditCard,
  FlaskConical,
  HeartPulse,
  Pill,
  ShieldCheck,
  ShieldPlus,
  Stethoscope,
  User,
  UserCheck,
  Zap
} from "lucide-react";
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
  { roleKey: "admin", label: "Admin", email: "admin@healthguard.com", password: "Pass@12345", icon: ShieldCheck },
  { roleKey: "manager", label: "Manager", email: "manager@healthguard.com", password: "Pass@12345", icon: Briefcase },
  { roleKey: "doctor", label: "Doctor", email: "doctor@healthguard.com", password: "Pass@12345", icon: Stethoscope },
  { roleKey: "nurse", label: "Nurse (Triage)", email: "nurse@healthguard.com", password: "Pass@12345", icon: Activity },
  { roleKey: "nurse2", label: "Nurse (Ward)", email: "nurse2@healthguard.com", password: "Pass@12345", icon: UserCheck },
  { roleKey: "pharmacist", label: "Pharmacist", email: "pharmacist@healthguard.com", password: "Pass@12345", icon: Pill },
  { roleKey: "cashier", label: "Cashier", email: "cashier@healthguard.com", password: "Pass@12345", icon: CreditCard },
  { roleKey: "lab", label: "Lab MLT", email: "lab@healthguard.com", password: "Pass@12345", icon: FlaskConical },
  { roleKey: "patient", label: "Patient", email: "saman.kumara82@gmail.com", password: "Pass@12345", icon: User }
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
    <section className="auth-page" style={{ padding: "30px 16px" }}>
      <div className="auth-card wide" style={{ maxWidth: "1020px", width: "100%", padding: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "36px", alignItems: "start" }}>
          {/* Left Column: Traditional Form */}
          <div>
            <div className="auth-header" style={{ textAlign: "left", marginBottom: "22px" }}>
              <div className="auth-header-icon" style={{ margin: "0 0 14px 0" }}>
                <ShieldPlus size={28} />
              </div>
              <h1 style={{ fontSize: "1.75rem", marginBottom: "6px" }}>Health Guard Portal</h1>
              <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0 }}>
                Sign in to access your clinical workflows, patient records, or health portal.
              </p>
            </div>

            {apiError ? (
              <div className="form-alert" style={{ marginBottom: "18px" }}>
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

            <div className="auth-footer" style={{ marginTop: "20px", textAlign: "left", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
              <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                New patient? <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
              </p>
            </div>
          </div>

          {/* Right Column: Simple & Short Quick Access Buttons */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={18} color="#0284c7" />
                <h2 style={{ fontSize: "1.02rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Quick Access
                </h2>
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "#0369a1",
                  background: "#e0f2fe",
                  padding: "2px 8px",
                  borderRadius: "6px"
                }}
              >
                1-Click Sign In
              </span>
            </div>

            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0, lineHeight: "1.4" }}>
              Click any role to sign in directly:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px"
              }}
            >
              {QUICK_ACCESS_ROLES.map((acc) => {
                const IconComponent = acc.icon;
                const isLoading = isSubmitting && activeQuickKey === acc.label;
                const isFullWidth = acc.roleKey === "patient";

                return (
                  <button
                    key={acc.roleKey}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickLogin(acc)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isFullWidth ? "center" : "flex-start",
                      gap: "8px",
                      height: "38px",
                      padding: "0 12px",
                      gridColumn: isFullWidth ? "span 2" : "span 1",
                      background: isLoading ? "#f0f9ff" : "#ffffff",
                      border: isLoading ? "1px solid #0284c7" : "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "0.83rem",
                      fontWeight: 600,
                      color: isLoading ? "#0284c7" : "#334155",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.borderColor = "#0284c7";
                        e.currentTarget.style.background = "#f0f9ff";
                        e.currentTarget.style.color = "#0369a1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.color = "#334155";
                      }
                    }}
                  >
                    <IconComponent size={14} style={{ flexShrink: 0, color: "#0284c7" }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {isLoading ? "Signing in..." : acc.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "2px",
                padding: "8px 12px",
                background: "#ffffff",
                border: "1px dashed #cbd5e1",
                borderRadius: "8px",
                fontSize: "0.76rem",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>Universal Password:</span>
              <strong style={{ color: "#0f172a", fontFamily: "monospace", fontSize: "0.82rem" }}>Pass@12345</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
