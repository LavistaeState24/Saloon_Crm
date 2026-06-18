import { useState } from "react";
import { Building2, Eye, EyeOff, KeyRound, Mail, Phone, ShieldCheck, UserRound, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import { useAuth } from "../../../hooks/useAuth";
import { authService } from "../../../services/authService";
import { toast } from "../../../utils/toast";
import {
  applyServerErrors,
  emailRules,
  getErrorMessage,
  phoneRules,
  textRules,
} from "../../../utils/validation";

const initialRegisterState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
    setError: setLoginFieldError,
  } = useForm({
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    watch,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    setError: setRegisterFieldError,
  } = useForm({
    mode: "onBlur",
    defaultValues: initialRegisterState,
  });

  const destination = location.state?.from?.pathname || "/dashboard";
  const registerPassword = watch("password");

  const handleLogin = async (formValues) => {
    setLoginError("");
    try {
      await login(formValues);
      navigate(destination, { replace: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to sign in");
      applyServerErrors(requestError, setLoginFieldError, setLoginError);
    }
  };

  const handleRegister = async (formValues) => {
    setRegisterError("");
    try {
      const payload = {
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone,
        password: formValues.password,
        confirmPassword: formValues.confirmPassword,
      };

      await authService.register(payload);
      await login({ email: formValues.email, password: formValues.password });
      navigate(destination, { replace: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to create account");
      applyServerErrors(requestError, setRegisterFieldError, setRegisterError);
    }
  };

  return (
    <div className="min-h-screen bg-ink bg-glow px-6 py-12 text-ivory">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-glass backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.4em] text-gold">Salon Appointment Desk</p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-tight text-ivory">
            The premium control system for real estate inventory, leads, and curated client sharing.
          </h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Service intelligence", icon: Building2 },
              { label: "Role-based operations", icon: Users },
              { label: "Client-safe sharing", icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-muted">
                  <Icon className="mb-3 h-5 w-5 text-gold-2" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex gap-3">
            <Button variant={mode === "login" ? "primary" : "secondary"} onClick={() => setMode("login")}>
              Login
            </Button>
            <Button variant={mode === "register" ? "primary" : "secondary"} onClick={() => setMode("register")}>
              Register
            </Button>
          </div>

          {mode === "login" ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit(handleLogin)}>
              <FormInput
                label="Email"
                // ref={ref}
                type="email"
                icon={Mail}
                placeholder="Enter your email"
                error={getErrorMessage(loginErrors.email)}
                {...registerLogin("email", emailRules())}
              />
              <FormInput
                label="Password"
                // ref={ref}
                type={showLoginPassword ? "text" : "password"}
                icon={KeyRound}
                placeholder="Enter your password"
                error={getErrorMessage(loginErrors.password)}
                rightElement={
                  <button
                    type="button"
                    className="transition hover:text-ivory"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...registerLogin("password", {
                  required: "Password is required",
                })}
              />
              {loginError ? <p className="text-sm text-rose-300">{loginError}</p> : null}
              <Button className="w-full" disabled={isLoginSubmitting} icon={ShieldCheck}>
                {isLoginSubmitting ? "Authenticating..." : "Enter CRM"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegisterSubmit(handleRegister)}>
              <FormInput
                label="Full Name"
                // ref={ref}
                icon={UserRound}
                placeholder="Enter your full name"
                error={getErrorMessage(registerErrors.name)}
                {...registerRegister("name", textRules("Name", { min: 3, max: 60 }))}
              />
              <FormInput
                label="Email"
                // ref={ref}
                type="email"
                icon={Mail}
                placeholder="Enter your email"
                error={getErrorMessage(registerErrors.email)}
                {...registerRegister("email", emailRules())}
              />
              <FormInput
                label="Phone"
                // ref={ref}
                type="tel"
                icon={Phone}
                placeholder="Enter your mobile number"
                error={getErrorMessage(registerErrors.phone)}
                {...registerRegister("phone", phoneRules())}
              />
              <FormInput
                label="Password"
                // ref={ref}
                type={showRegisterPassword ? "text" : "password"}
                icon={KeyRound}
                placeholder="Create a strong password"
                error={getErrorMessage(registerErrors.password)}
                rightElement={
                  <button
                    type="button"
                    className="transition hover:text-ivory"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                    aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                  >
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...registerRegister("password", passwordRules())}
              />
              <FormInput
                label="Confirm Password"
                type={showRegisterPassword ? "text" : "password"}
                icon={KeyRound}
                placeholder="Re-enter your password"
                error={getErrorMessage(registerErrors.confirmPassword)}
                {...registerRegister("confirmPassword", {
                  required: "Confirm password is required",
                  validate: (value) => value === registerPassword || "Passwords do not match",
                })}
              />
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-muted">
                Public registration creates a <span className="text-ivory">Sales Executive</span> account only.
                Admin and Super Admin accounts must be created from the secured team access settings.
              </div>
              {registerError ? <p className="text-sm text-rose-300">{registerError}</p> : null}
              <Button className="w-full" disabled={isRegisterSubmitting} icon={Users}>
                {isRegisterSubmitting ? "Creating..." : "Create account"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
