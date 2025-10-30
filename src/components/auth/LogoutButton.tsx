import React from "react";
import { Button } from "../ui/button";

export const LogoutButton: React.FC = () => {
  return (
    <form action="/api/auth/logout" method="post" data-test-id="logout-form">
      <Button type="submit" variant="ghost" data-test-id="logout-button">
        Logout
      </Button>
    </form>
  );
};
