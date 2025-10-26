
# User Journey - Authentication Module

## Overview

This diagram visualizes the complete user journey through the CaloriesTracker authentication system, including login, registration, password recovery, and application access flows.

<mermaid_diagram>

```
stateDiagram-v2

[*] --> HomePage

state "Authentication" as Authentication {
  [*] --> HomePage
  
  HomePage --> RegistrationForm: Click Sign Up
  HomePage --> LoginForm: Click Sign In
  HomePage --> [*]
  
  state "Registration Process" as RegistrationProcess {
    [*] --> RegistrationForm
    RegistrationForm --> RegistrationValidation: Submit Form
    RegistrationValidation --> if_reg_valid <<choice>>
    if_reg_valid --> EmailConfirmation: Valid Email & Password
    if_reg_valid --> RegistrationError: Invalid Input
    RegistrationError --> RegistrationForm: Fix & Retry
    EmailConfirmation --> EmailVerification: User Confirms Email
    EmailVerification --> if_email_valid <<choice>>
    if_email_valid --> RegistrationSuccess: Email Verified
    if_email_valid --> EmailExpired: Link Expired
    EmailExpired --> RegistrationForm: Start Over
    RegistrationSuccess --> [*]
  }
  
  state "Login Process" as LoginProcess {
    [*] --> LoginForm
    LoginForm --> CredentialsValidation: Submit Credentials
    CredentialsValidation --> if_creds_valid <<choice>>
    if_creds_valid --> SessionCreated: Credentials Valid
    if_creds_valid --> LoginError: Invalid Credentials
    LoginError --> LoginForm: Retry
    SessionCreated --> [*]
  }
  
  state "Password Recovery" as PasswordRecovery {
    [*] --> ForgotPasswordModal
    ForgotPasswordModal --> EmailEntry: Request Password Reset
    EmailEntry --> if_email_exists <<choice>>
    if_email_exists --> RecoveryEmailSent: Email Exists
    if_email_exists --> EmailNotFound: Email Not Found
    EmailNotFound --> EmailEntry: Try Another Email
    RecoveryEmailSent --> UserChecksEmail: User Opens Email
    UserChecksEmail --> RecoveryLink: Clicks Recovery Link
    RecoveryLink --> UpdatePasswordPage: Link Valid
    UpdatePasswordPage --> PasswordSubmission: Enter New Password
    PasswordSubmission --> PasswordUpdated: Update Successful
    PasswordUpdated --> [*]
  }
  
  RegistrationProcess --> LoginForm: Registration Complete
  PasswordRecovery --> LoginForm: Password Reset Complete
}

state "Application" as Application {
  SessionCreated --> Dashboard: Session Created
  LoginForm --> if_user_auth <<choice>>: Try Login
  if_user_auth --> Dashboard: Authenticated
  if_user_auth --> LoginError: Failed
  
  Dashboard --> Dashboard: Use Application
  Dashboard --> LogoutAction: Click Logout
  LogoutAction --> LogoutConfirm: Confirm Logout
  LogoutConfirm --> HomePage: Session Terminated
}

state "Route Protection" as RouteProtection {
  HomePage --> if_has_session <<choice>>: User Visits /
  if_has_session --> Dashboard: Session Active
  if_has_session --> HomePage: No Session
  
  Dashboard --> if_dashboard_auth <<choice>>: User Visits /dashboard
  if_dashboard_auth --> Dashboard: Authenticated
  if_dashboard_auth --> HomePage: Not Authenticated
}

HomePage --> ForgotPasswordModal: Forgot Password Link

note right of HomePage
  Landing page with Sign In and Sign Up tabs
  Public route accessible to all users
end note

note right of EmailConfirmation
  User receives confirmation email
  Must verify email to complete registration
end note

note right of Dashboard
  Main application interface
  Protected route - requires authentication
end note

note right of LoginForm
  Email and password entry
  Client-side validation on inputs
end note

note right of RouteProtection
  Middleware handles route protection
  Redirects based on authentication state
end note

Dashboard --> [*]
HomePage --> [*]

