/**
 * Authentication validation utilities
 */

/**
 * Validates an email address format
 * @param email - The email string to validate
 * @returns true if the email format is valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password meets minimum requirements
 * @param password - The password string to validate
 * @returns true if the password meets requirements, false otherwise
 */
export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Validates that two password strings match
 * @param password - The original password
 * @param confirmPassword - The confirmation password
 * @returns true if passwords match, false otherwise
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * Validates an email field for required and format errors
 * @param email - The email string to validate
 * @returns An error message string if invalid, empty string if valid
 */
export const validateEmailField = (email: string): string => {
  if (!email) {
    return "Email is required";
  }
  if (!validateEmail(email)) {
    return "Invalid email format";
  }
  return "";
};

/**
 * Validates a password field for required and strength errors
 * @param password - The password string to validate
 * @returns An error message string if invalid, empty string if valid
 */
export const validatePasswordField = (password: string): string => {
  if (!password) {
    return "Password is required";
  }
  if (!validatePassword(password)) {
    return "Password must be at least 8 characters";
  }
  return "";
};

/**
 * Validates a confirm password field matches the original
 * @param password - The original password
 * @param confirmPassword - The confirmation password
 * @returns An error message string if invalid, empty string if valid
 */
export const validateConfirmPasswordField = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) {
    return "Confirm password is required";
  }
  if (!validatePasswordMatch(password, confirmPassword)) {
    return "Passwords do not match";
  }
  return "";
};
