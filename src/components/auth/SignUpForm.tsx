import React, { useState } from "react";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";

type FormErrors = Record<string, string>;

interface SignUpFormProps {
  onError?: (error: string) => void;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const SignUpForm: React.FC<SignUpFormProps> = ({ onError }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFormErrors({});

    const errors: FormErrors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Invalid email format";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (!validatePassword(password)) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || "Failed to create account. Please try again.";
        setError(errorMsg);
        onError?.(errorMsg);
      } else {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        const successMsg = "Registration successful! Please check your email to confirm your account.";
        setSuccess(successMsg);
      }
    } catch (err) {
      console.error("Sign-up error:", err);
      const errorMsg = "An error occurred. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-test-id="signup-form">
      {error && (
        <Alert
          variant="destructive"
          className="text-sm"
          role="alert"
          aria-live="polite"
          data-test-id="signup-form-error"
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          className="text-sm bg-green-50 border-green-200 text-green-800"
          role="status"
          aria-live="polite"
          data-test-id="signup-form-success"
        >
          {success}
        </Alert>
      )}

      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-1">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            formErrors.email ? "border-destructive" : "border-input"
          }`}
          placeholder="you@example.com"
          disabled={loading}
          data-test-id="signup-form-email"
        />
        {formErrors.email && (
          <p className="mt-1 text-xs text-destructive" data-test-id="signup-form-email-error">
            {formErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-1">
          Password (min. 8 characters)
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            formErrors.password ? "border-destructive" : "border-input"
          }`}
          placeholder="••••••••"
          disabled={loading}
          data-test-id="signup-form-password"
        />
        {formErrors.password && (
          <p className="mt-1 text-xs text-destructive" data-test-id="signup-form-password-error">
            {formErrors.password}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-foreground mb-1">
          Confirm Password
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            formErrors.confirmPassword ? "border-destructive" : "border-input"
          }`}
          placeholder="••••••••"
          disabled={loading}
          data-test-id="signup-form-confirm-password"
        />
        {formErrors.confirmPassword && (
          <p className="mt-1 text-xs text-destructive" data-test-id="signup-form-confirm-password-error">
            {formErrors.confirmPassword}
          </p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full" aria-busy={loading} data-test-id="signup-form-submit">
        {loading ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
};
