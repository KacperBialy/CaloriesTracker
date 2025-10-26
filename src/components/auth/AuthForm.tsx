import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";

type Tab = "signin" | "signup";

type FormErrors = Record<string, string>;

export const AuthForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Sign-in state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign-up state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});

    // Client-side validation
    const errors: FormErrors = {};

    if (!signInEmail) {
      errors.email = "Email is required";
    } else if (!validateEmail(signInEmail)) {
      errors.email = "Invalid email format";
    }

    if (!signInPassword) {
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
        body: JSON.stringify({
          email: signInEmail,
          password: signInPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Invalid credentials");
      } else {
        // Successful login - reload page to trigger middleware redirect
        window.location.reload();
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});

    // Client-side validation
    const errors: FormErrors = {};

    if (!signUpEmail) {
      errors.email = "Email is required";
    } else if (!validateEmail(signUpEmail)) {
      errors.email = "Invalid email format";
    }

    if (!signUpPassword) {
      errors.password = "Password is required";
    } else if (!validatePassword(signUpPassword)) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!signUpConfirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (signUpPassword !== signUpConfirmPassword) {
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
        body: JSON.stringify({
          email: signUpEmail,
          password: signUpPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create account. Please try again.");
      } else {
        setError("");
        setSignUpEmail("");
        setSignUpPassword("");
        setSignUpConfirmPassword("");
        setError(""); // Clear error on success
        // Show success message or redirect as needed
        alert("Registration successful! Please check your email to confirm your account.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Sign-up error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = signInEmail || prompt("Enter your email address");
    if (!email || !validateEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to send reset email");
      } else {
        alert("Password reset link has been sent to your email");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-foreground">CaloriesTracker</h2>

        {error && (
          <Alert variant="destructive" className="mb-4 text-sm" role="alert" aria-live="polite">
            {error}
          </Alert>
        )}

        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => {
              setActiveTab("signin");
              setError("");
              setFormErrors({});
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === "signin"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-selected={activeTab === "signin"}
            role="tab"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setError("");
              setFormErrors({});
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === "signup"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-selected={activeTab === "signup"}
            role="tab"
          >
            Sign Up
          </button>
        </div>

        {/* Sign In Form */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  formErrors.email ? "border-destructive" : "border-input"
                }`}
                placeholder="you@example.com"
                disabled={loading}
              />
              {formErrors.email && <p className="mt-1 text-xs text-destructive">{formErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="signin-password" className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  formErrors.password ? "border-destructive" : "border-input"
                }`}
                placeholder="••••••••"
                disabled={loading}
              />
              {formErrors.password && <p className="mt-1 text-xs text-destructive">{formErrors.password}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full" aria-busy={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {/* Sign Up Form */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  formErrors.email ? "border-destructive" : "border-input"
                }`}
                placeholder="you@example.com"
                disabled={loading}
              />
              {formErrors.email && <p className="mt-1 text-xs text-destructive">{formErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-1">
                Password (min. 8 characters)
              </label>
              <input
                id="signup-password"
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  formErrors.password ? "border-destructive" : "border-input"
                }`}
                placeholder="••••••••"
                disabled={loading}
              />
              {formErrors.password && <p className="mt-1 text-xs text-destructive">{formErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-foreground mb-1">
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  formErrors.confirmPassword ? "border-destructive" : "border-input"
                }`}
                placeholder="••••••••"
                disabled={loading}
              />
              {formErrors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{formErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full" aria-busy={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
};
