import React, { useState } from "react";
import { Card } from "../ui/card";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

type Tab = "signin" | "signup";

export const AuthForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("signin");

  return (
    <Card className="w-full max-w-md" data-test-id="auth-form">
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-foreground">CaloriesTracker</h2>

        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === "signin"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-selected={activeTab === "signin"}
            role="tab"
            data-test-id="auth-form-signin-tab"
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === "signup"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-selected={activeTab === "signup"}
            role="tab"
            data-test-id="auth-form-signup-tab"
          >
            Sign Up
          </button>
        </div>

        {activeTab === "signin" && <SignInForm />}
        {activeTab === "signup" && <SignUpForm />}
      </div>
    </Card>
  );
};
