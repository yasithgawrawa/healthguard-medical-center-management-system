import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormInput } from "../../components/shared/forms/FormInput.jsx";
import { SubmitButton } from "../../components/shared/forms/SubmitButton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DASHBOARD_PATH_BY_ROLE } from "../../utils/roles.js";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
});

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setApiError("");
    try {
      const user = await login(values);
      navigate(location.state?.from?.pathname || DASHBOARD_PATH_BY_ROLE[user.role] || "/", { replace: true });
    } catch (error) {
      setApiError(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <h1>Login</h1>
        {apiError ? <div className="form-alert">{apiError}</div> : null}
        <FormInput label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <FormInput label="Password" type="password" error={errors.password?.message} {...register("password")} />
        <SubmitButton isSubmitting={isSubmitting}>Login</SubmitButton>
        <p>New patient? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  );
};
