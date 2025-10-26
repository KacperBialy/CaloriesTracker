import React, { useState } from "react";
import { Button } from "../ui/button";

export const LogoutButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Redirect to home page after successful logout
        window.location.href = "/";
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogout}>
      <Button type="submit" variant="outline" disabled={loading} aria-busy={loading}>
        {loading ? "Logging out..." : "Logout"}
      </Button>
    </form>
  );
};
