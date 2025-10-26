import React from "react";
import { Button } from "../ui/button";

export const LogoutButton: React.FC = () => {
  return (
    <form action="/api/auth/logout" method="post">
      <Button type="submit" variant="ghost">
        Logout
      </Button>
    </form>
  );
};
