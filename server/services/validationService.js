/**
 * Centralized validation service
 * All input validation rules in one place
 */

const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  EMAIL_REGEX: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  PHONE_REGEX: /^\d{10}$/,
  NAME_MIN_LENGTH: 2,
  DESCRIPTION_MIN_LENGTH: 10,
};

export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`,
    };
  }
  
  if (!VALIDATION_RULES.PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character (@$!%*?&)",
    };
  }
  
  return { valid: true };
};

export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, message: "Email is required" };
  }
  
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return { valid: false, message: "Please provide a valid email address" };
  }
  
  return { valid: true };
};

export const validatePhone = (phone) => {
  if (!phone) {
    return { valid: false, message: "Phone number is required" };
  }
  
  if (!VALIDATION_RULES.PHONE_REGEX.test(phone)) {
    return { valid: false, message: "Phone number must be 10 digits" };
  }
  
  return { valid: true };
};

export const validateName = (name) => {
  if (!name) {
    return { valid: false, message: "Name is required" };
  }
  
  if (name.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    return {
      valid: false,
      message: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`,
    };
  }
  
  return { valid: true };
};

export const validateDescription = (description) => {
  if (!description) {
    return { valid: false, message: "Description is required" };
  }
  
  if (description.length < VALIDATION_RULES.DESCRIPTION_MIN_LENGTH) {
    return {
      valid: false,
      message: `Description must be at least ${VALIDATION_RULES.DESCRIPTION_MIN_LENGTH} characters`,
    };
  }
  
  return { valid: true };
};

export const validateSignupData = (data) => {
  const { name, email, phone, password } = data;
  
  const nameValidation = validateName(name);
  if (!nameValidation.valid) return nameValidation;
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) return emailValidation;
  
  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.valid) return phoneValidation;
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) return passwordValidation;
  
  return { valid: true };
};

export const validateLoginData = (data) => {
  const { email, password } = data;
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) return emailValidation;
  
  if (!password) {
    return { valid: false, message: "Password is required" };
  }
  
  return { valid: true };
};

export const sanitizeEmail = (email) => {
  return email ? email.toLowerCase().trim() : null;
};

export const sanitizeName = (name) => {
  return name ? name.trim() : null;
};

export const sanitizePhone = (phone) => {
  return phone ? phone.replace(/\D/g, "") : null;
};

export default {
  validatePassword,
  validateEmail,
  validatePhone,
  validateName,
  validateDescription,
  validateSignupData,
  validateLoginData,
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  VALIDATION_RULES,
};
