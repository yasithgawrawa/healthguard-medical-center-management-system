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

const QUICK_ACCESS_ACCOUNTS = [
  {
    roleKey: "admin",
    badge: "ADMIN",
    title: "Executive Admin",
    email: "admin@healthguard.com",
    password: "Pass@12345",
    color: "#6d28d9",
    bgColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    icon: ShieldCheck
  },
  {
    roleKey: "manager",
    badge: "MANAGER",
    title: "Clinical Operations",
    email: "manager@healthguard.com",
    password: "Pass@12345",
    color: "#1d4ed8",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    icon: Briefcase
  },
  {
    roleKey: "doctor",
    badge: "DOCTOR",
    title: "Dr. Amara Perera",
    email: "doctor@healthguard.com",
    password: "Pass@12345",
    color: "#0369a1",
    bgColor: "#f0f9ff",
    borderColor: "#bae6fd",
    icon: Stethoscope
  },
  {
    roleKey: "nurse_triage",
    badge: "NURSE (TRIAGE)",
    title: "Ishara Silva",
    email: "nurse@healthguard.com",
    password: "Pass@12345",
    color: "#0f766e",
    bgColor: "#f0fdfa",
    borderColor: "#99f6e4",
    icon: Activity
  },
  {
    roleKey: "nurse_ward",
    badge: "NURSE (WARD)",
    title: "Sanduni Rathnayake",
    email: "nurse2@healthguard.com",
    password: "Pass@12345",
    color: "#047857",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    icon: UserCheck
  },
  {
    roleKey: "pharmacist",
    badge: "PHARMACIST",
    title: "Dinesh Gunasekara",
    email: "pharmacist@healthguard.com",
    password: "Pass@12345",
    color: "#7e22ce",
    bgColor: "#faf5ff",
    borderColor: "#e9d5ff",
    icon: Pill
  },
  {
    roleKey: "cashier",
    badge: "CASHIER",
    title: "Malsha Wijesinghe",
    email: "cashier@healthguard.com",
    password: "Pass@12345",
    color: "#b45309",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    icon: CreditCard
  },
  {
    roleKey: "lab",
    badge: "LAB MLT",
    title: "Tharindu Abeysekara",
    email: "lab@healthguard.com",
    password: "Pass@12345",
    color: "#b91c1c",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    icon: FlaskConical
  },
  {
    roleKey: "patient",
    badge: "PATIENT",
    title: "Saman Kumara",
    email: "saman.kumara82@gmail.com",
    password: "Pass@12345",
    color: "#15803d",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    icon: User
  }
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
    setActiveQuickKey(acc.roleKey);
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

          {/* Right Column: 1-Click Quick Access Logins */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "20px 22px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={18} color="#f59e0b" fill="#f59e0b" />
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Quick Access Demo Logins
                </h2>
              </div>
              <span
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  color: "#475569",
                  background: "#e2e8f0",
                  padding: "3px 8px",
                  borderRadius: "10px"
                }}
              >
                1-Click Login
              </span>
            </div>

            <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "14px", lineHeight: "1.4" }}>
              Click any role below to automatically authenticate and test that dashboard:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "10px",
                maxHeight: "440px",
                overflowY: "auto",
                paddingRight: "2px"
              }}
            >
              {QUICK_ACCESS_ACCOUNTS.map((acc) => {
                const IconComponent = acc.icon;
                const isLoading = isSubmitting && activeQuickKey === acc.roleKey;

                return (
                  <button
                    key={acc.roleKey}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickLogin(acc)}
                    style={{
                      background: acc.bgColor,
                      border: `1px solid ${acc.borderColor}`,
                      borderRadius: "10px",
                      padding: "10px 12px",
                      textAlign: "left",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      transition: "all 0.18s ease-in-out",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      position: "relative",
                      opacity: isSubmitting && !isLoading ? 0.6 : 1,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.03)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: acc.color,
                          letterSpacing: "0.03em"
                        }}
                      >
                        {acc.badge}
                      </span>
                      <IconComponent size={15} color={acc.color} />
                    </div>

                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {isLoading ? "Signing in..." : acc.title}
                    </div>

                    <div style={{ fontSize: "0.74rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {acc.email}
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "14px",
                padding: "8px 12px",
                background: "#ffffff",
                border: "1px dashed #cbd5e1",
                borderRadius: "8px",
                fontSize: "0.78rem",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>Universal Password:</span>
              <strong style={{ color: "#0f172a", fontFamily: "monospace", fontSize: "0.84rem" }}>Pass@12345</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
