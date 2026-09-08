import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Lock, Mail, ShieldPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormInput } from "../../components/shared/forms/FormInput.jsx";
import { SubmitButton } from "../../components/shared/forms/SubmitButton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DASHBOARD_PATH_BY_ROLE, ROLES } from "../../utils/roles.js";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

const demoAccounts = [
  { role: "Doctor", email: "doctor@healthguard.local", label: "Doctor" },
  { role: "Patient", email: "patient@healthguard.local", label: "Patient" },
  { role: "Admin", email: "admin@healthguard.local", label: "Admin" },
  { role: "Nurse", email: "nurse@healthguard.local", label: "Nurse" },
  { role: "Pharmacist", email: "pharmacist@healthguard.local", label: "Pharmacist" },
  { role: "Cashier", email: "cashier@healthguard.local", label: "Cashier" },
  { role: "Lab", email: "lab@healthguard.local", label: "Lab" },
  { role: "Manager", email: "manager@healthguard.local", label: "Manager" }
];

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setApiError("");
    try {
      const user = await login(values);
      navigate(location.state?.from?.pathname || DASHBOARD_PATH_BY_ROLE[user.role] || "/", { replace: true });
    } catch (error) {
      setApiError(error.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const handleFillDemo = (email) => {
    setValue("email", email);
    setValue("password", "Password@123");
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-header-icon">
            <ShieldPlus size={28} />
          </div>
          <h1>Welcome to Health Guard</h1>
          <p>Sign in to access your clinical dashboard and medical records</p>
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
            placeholder="name@healthguard.local"
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

          <SubmitButton isSubmitting={isSubmitting}>Sign In</SubmitButton>
        </form>

        <div className="auth-footer">
          <p>
            New patient? <Link to="/register">Create an account</Link>
          </p>
        </div>

        <div className="demo-role-box">
          <span>Quick Demo Logins (Password@123):</span>
          <div className="role-chip-grid">
            {demoAccounts.map((acc) => (
              <button
                type="button"
                className="role-chip-btn"
                key={acc.role}
                onClick={() => handleFillDemo(acc.email)}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
