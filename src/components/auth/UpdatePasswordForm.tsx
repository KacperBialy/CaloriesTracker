import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";

type FormErrors = Record<string, string>;

export const UpdatePasswordForm: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check if there's a recovery token in the URL hash
    const hash = window.location.hash;
    if (hash) {
      setHasToken(true);
    } else {
      setError("Invalid or missing password recovery link");
    }
  }, []);

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFormErrors({});

    // Client-side validation
    const errors: FormErrors = {};

    if (!newPassword) {
      errors.password = "Password is required";
    } else if (!validatePassword(newPassword)) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // This would typically use Supabase client-side library to update password
      // For now, we're setting up the form structure
      // The actual implementation will depend on Supabase auth flow
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update password. Please try again.");
      } else {
        setSuccess("Password updated successfully! Redirecting to login...");
        setNewPassword("");
        setConfirmPassword("");
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Update password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center mb-2 text-foreground">Reset Password</h2>
        <p className="text-center text-muted-foreground mb-6 text-sm">Enter your new password below</p>

        {!hasToken && (
          <Alert variant="destructive" role="alert" aria-live="polite">
            {error}
          </Alert>
        )}

        {error && hasToken && (
          <Alert variant="destructive" className="mb-4" role="alert" aria-live="polite">
            {error}
          </Alert>
        )}

        {success && <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">{success}</Alert>}

        {hasToken && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-1">
                New Password (min. 8 characters)
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  formErrors.password ? "border-destructive" : "border-input"
                }`}
                placeholder="••••••••"
                disabled={loading}
              />
              {formErrors.password && <p className="mt-1 text-xs text-destructive">{formErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Updating password..." : "Update Password"}
            </Button>

            <div className="text-center">
              <a href="/" className="text-sm text-primary hover:underline">
                Back to sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
};
