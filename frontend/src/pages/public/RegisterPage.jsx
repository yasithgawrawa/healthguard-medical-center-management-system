import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormInput } from "../../components/shared/forms/FormInput.jsx";
import { FormSelect } from "../../components/shared/forms/FormSelect.jsx";
import { SubmitButton } from "../../components/shared/forms/SubmitButton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DASHBOARD_PATH_BY_ROLE } from "../../utils/roles.js";

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a special character");

const schema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(7, "Phone number is required"),
    address: z.string().optional(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["female", "male", "other", "prefer_not_to_say"]),
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

export const RegisterPage = () => {
  const { registerPatient } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { gender: "prefer_not_to_say" }
  });

  const onSubmit = async (values) => {
    setApiError("");
    try {
      const user = await registerPatient(values);
      navigate(DASHBOARD_PATH_BY_ROLE[user.role], { replace: true });
    } catch (error) {
      setApiError(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-form wide" onSubmit={handleSubmit(onSubmit)}>
        <h1>Patient Registration</h1>
        {apiError ? <div className="form-alert">{apiError}</div> : null}
        <div className="form-grid">
          <FormInput label="First name" error={errors.firstName?.message} {...register("firstName")} />
          <FormInput label="Last name" error={errors.lastName?.message} {...register("lastName")} />
          <FormInput label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <FormInput label="Phone" error={errors.phone?.message} {...register("phone")} />
          <FormInput label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
          <FormSelect label="Gender" error={errors.gender?.message} {...register("gender")}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </FormSelect>
          <FormInput label="Address" error={errors.address?.message} {...register("address")} />
          <span />
          <FormInput label="Password" type="password" error={errors.password?.message} {...register("password")} />
          <FormInput label="Confirm password" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        </div>
        <SubmitButton isSubmitting={isSubmitting}>Create Patient Account</SubmitButton>
        <p>Already registered? <Link to="/login">Login</Link></p>
      </form>
    </section>
  );
};
