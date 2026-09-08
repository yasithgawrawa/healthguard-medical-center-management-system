import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ShieldPlus } from "lucide-react";
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
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a special character");

const schema = z
  .object({
    firstName: requiredName("First name"),
    lastName: requiredName("Last name"),
    email: z.string().email("Enter a valid email"),
    phone: requiredPhone,
    address: z.string().trim().min(5, "Address is required").max(250, "Address is too long"),
    dateOfBirth: requiredPastDate("Date of birth"),
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
    mode: "onChange",
    defaultValues: { gender: "prefer_not_to_say" }
  });

  const onSubmit = async (values) => {
    setApiError("");
    try {
      const user = await registerPatient(values);
      navigate(DASHBOARD_PATH_BY_ROLE[user.role] || "/patient", { replace: true });
    } catch (error) {
      setApiError(error.response?.data?.message || "Registration failed. Please check your details.");
    }
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
          <div className="form-alert">
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid">
            <FormInput
              label="First Name"
              placeholder="Saman"
              sanitize={stripDigits}
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <FormInput
              label="Last Name"
              placeholder="Kumara"
              sanitize={stripDigits}
              error={errors.lastName?.message}
              {...register("lastName")}
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="saman.kumara@example.lk"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormInput
              label="Phone Number"
              placeholder="+94 77 123 4567"
              inputMode="tel"
              sanitize={stripNonPhone}
              error={errors.phone?.message}
              {...register("phone")}
            />
            <FormInput
              label="Date of Birth"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth")}
            />
            <FormSelect label="Gender" error={errors.gender?.message} {...register("gender")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </FormSelect>
            <FormInput
              label="Residential Address"
              placeholder="No. 24, Galle Road, Colombo 03"
              error={errors.address?.message}
              {...register("address")}
            />
            <span />
            <FormInput
              label="Password (min 8 chars, 1 uppercase, 1 symbol)"
              type="password"
              placeholder="Password@123"
              error={errors.password?.message}
              {...register("password")}
            />
            <FormInput
              label="Confirm Password"
              type="password"
              placeholder="Password@123"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          <SubmitButton isSubmitting={isSubmitting}>Create Patient Account</SubmitButton>
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
