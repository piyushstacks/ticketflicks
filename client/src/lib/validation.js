export const fieldId = (formId, name) => `${formId}-${name}`;

export const errorId = (formId, name) => `${formId}-${name}-error`;

export const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

export const composeValidators =
  (...validators) =>
    (value, values) => {
      for (const validator of validators) {
        const error = validator(value, values);
        if (error) return error;
      }
      return "";
    };

export const optional =
  (validator) =>
    (value, values) => {
      if (isEmpty(value)) return "";
      return validator(value, values);
    };

export const required =
  (label) =>
    (value) => {
      if (isEmpty(value)) return `${label} is required`;
      return "";
    };

export const minLength =
  (label, min) =>
    (value) => {
      const v = typeof value === "string" ? value : "";
      if (v.length < min) return `${label} must be at least ${min} characters`;
      return "";
    };

export const maxLength =
  (label, max) =>
    (value) => {
      const v = typeof value === "string" ? value : "";
      if (v.length > max) return `${label} must be at most ${max} characters`;
      return "";
    };

export const email =
  (label = "Email") =>
    (value) => {
      const v = (value || "").trim();
      if (!v) return `${label} is required`;
      if (!v.includes("@")) return `${label} must contain @ symbol`;
      const [local, domain] = v.split("@");
      if (!local) return `${label} must include text before @`;
      if (!domain) return `${label} must include a domain after @`;
      if (!domain.includes(".")) return `${label} must include a domain extension (e.g., .com)`;
      const basicEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!basicEmail.test(v)) return `Enter a valid ${label.toLowerCase()} address`;
      return "";
    };

export const phone10 =
  (label = "Phone number") =>
    (value) => {
      const raw = typeof value === "string" ? value : "";
      const digits = raw.replace(/\D/g, "");
      if (!digits) return `${label} is required`;
      if (digits.length !== 10) return `${label} must be 10 digits`;
      if (!/^\d{10}$/.test(digits)) return `${label} must contain only digits`;
      return "";
    };

export const optionalPhone10 =
  (label = "Phone number") =>
    (value) => {
      const raw = typeof value === "string" ? value : "";
      if (!raw.trim()) return "";
      const digits = raw.replace(/\D/g, "");
      if (digits.length !== 10) return `${label} must be 10 digits`;
      if (!/^\d{10}$/.test(digits)) return `${label} must contain only digits`;
      return "";
    };

export const otp6 =
  (label = "OTP") =>
    (value) => {
      const v = (value || "").toString().trim();
      if (!v) return `${label} is required`;
      if (!/^\d+$/.test(v)) return `${label} must contain only digits`;
      if (v.length !== 6) return `${label} must be 6 digits`;
      return "";
    };

export const passwordStrong =
  (label = "Password") =>
    (value) => {
      const v = (value || "").toString();
      if (!v) return `${label} is required`;
      if (v.length < 8) return `${label} must be at least 8 characters`;
      if (!/[A-Z]/.test(v)) return `${label} must include an uppercase letter (A-Z)`;
      if (!/[a-z]/.test(v)) return `${label} must include a lowercase letter (a-z)`;
      if (!/\d/.test(v)) return `${label} must include a number (0-9)`;
      if (!/[@$!%*?&]/.test(v)) return `${label} must include a special character (@$!%*?&)`;
      return "";
    };

export const notSameAs =
  (otherField, label, otherLabel) =>
    (value, values) => {
      if (isEmpty(value) || isEmpty(values?.[otherField])) return "";
      if (value === values[otherField]) return `${label} must be different from ${otherLabel}`;
      return "";
    };

export const matchesField =
  (otherField, message) =>
    (value, values) => {
      if (isEmpty(value)) return "This field is required";
      if (value !== values?.[otherField]) return message;
      return "";
    };

export const booleanRequired =
  (label) =>
    (value) => {
      if (value !== true) return `${label} is required`;
      return "";
    };

export const numberMin =
  (label, min) =>
    (value) => {
      if (isEmpty(value)) return "";
      const n = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(n)) return `${label} must be a number`;
      if (n < min) return `${label} must be at least ${min}`;
      return "";
    };

export const url =
  (label) =>
    (value) => {
      const v = (value || "").toString().trim();
      if (!v) return "";
      try {
        const parsed = new URL(v);
        if (!/^https?:$/.test(parsed.protocol)) return `${label} must start with http:// or https://`;
        return "";
      } catch {
        return `Enter a valid ${label.toLowerCase()}`;
      }
    };

export const dateRequired =
  (label) =>
    (value) => {
      if (!value) return `${label} is required`;
      return "";
    };

export const dateNotPast =
  (label) =>
    (value) => {
      if (!value) return "";
      // Parse date string as LOCAL date at noon to avoid UTC timezone offset issues.
      // "2026-03-01" parsed as new Date("2026-03-01") = UTC midnight = yesterday in IST!
      const d = new Date(`${value}T12:00:00`);
      if (Number.isNaN(d.getTime())) return `${label} must be a valid date`;
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (d < startOfToday) return `${label} cannot be in the past`;
      return "";
    };

export const dateAfterOrEqual =
  (otherField, label, otherLabel) =>
    (value, values) => {
      if (!value || !values?.[otherField]) return "";
      const d1 = new Date(values[otherField]);
      const d2 = new Date(value);
      if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return "";
      if (d2 < d1) return `${label} must be on or after ${otherLabel}`;
      return "";
    };

export const fileRequired =
  (label) =>
    (value) => {
      if (!value) return `${label} is required`;
      return "";
    };

export const fileMaxSize =
  (label, maxBytes) =>
    (value) => {
      if (!value) return "";
      const size = value.size;
      if (typeof size !== "number") return "";
      if (size > maxBytes) {
        const mb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
        return `${label} must be smaller than ${mb} MB`;
      }
      return "";
    };

export const fileTypes =
  (label, allowedMimeTypes) =>
    (value) => {
      if (!value) return "";
      const type = value.type;
      if (!type) return "";
      if (!allowedMimeTypes.includes(type)) return `${label} must be one of: ${allowedMimeTypes.join(", ")}`;
      return "";
    };

export const validateValues = (schema, values) => {
  const nextErrors = {};
  for (const [name, validator] of Object.entries(schema)) {
    const error = validator(values?.[name], values);
    if (error) nextErrors[name] = error;
  }
  return nextErrors;
};

export const validateSingleField = (schema, values, name) => {
  const validator = schema?.[name];
  if (!validator) return "";
  return validator(values?.[name], values) || "";
};
