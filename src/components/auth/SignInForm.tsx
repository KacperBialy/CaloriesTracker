import React, { useState } from "react";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";

type FormErrors = Record<string, string>;

interface SignInFormProps {
  onError?: (error: string) => void;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const SignInForm: React.FC<SignInFormProps> = ({ onError }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});

    const errors: FormErrors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Invalid email format";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Invalid credentials");
        onError?.(errorData.message || "Invalid credentials");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      const errorMsg = "An error occurred. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const handleForgotPassword = async (): Promise<void> => {
    const forgotEmail = email || prompt("Enter your email address");
    if (!forgotEmail || !validateEmail(forgotEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || "Failed to send reset email";
        setError(errorMsg);
        onError?.(errorMsg);
      } else {
        alert("Password reset link has been sent to your email");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      const errorMsg = "An error occurred. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-test-id="signin-form" noValidate>
      {error && (
        <Alert
          variant="destructive"
          className="text-sm"
          role="alert"
          aria-live="polite"
          data-test-id="signin-form-error"
        >
          {error}
        </Alert>
      )}

      <div>
        <label htmlFor="signin-email" className="block text-sm font-medium text-foreground mb-1">
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            formErrors.email ? "border-destructive" : "border-input"
          }`}
          placeholder="you@example.com"
          disabled={loading}
          data-test-id="signin-form-email"
        />
        {formErrors.email && (
          <p className="mt-1 text-xs text-destructive" data-test-id="signin-form-email-error">
            {formErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="signin-password" className="block text-sm font-medium text-foreground mb-1">
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            formErrors.password ? "border-destructive" : "border-input"
          }`}
          placeholder="••••••••"
          disabled={loading}
          data-test-id="signin-form-password"
        />
        {formErrors.password && (
          <p className="mt-1 text-xs text-destructive" data-test-id="signin-form-password-error">
            {formErrors.password}
          </p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full" aria-busy={loading} data-test-id="signin-form-submit">
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
};
