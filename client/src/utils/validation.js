const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,32}$/;
const NUMBER_REGEX = /^\d+(\.\d+)?$/;
const HTTPS_URL_REGEX = /^https:\/\/[^\s/$.?#].[^\s]*$/i;

export const validationPatterns = {
  email: EMAIL_REGEX,
  indianPhone: INDIAN_PHONE_REGEX,
  password: PASSWORD_REGEX,
  number: NUMBER_REGEX,
  httpsUrl: HTTPS_URL_REGEX,
};

export const normalizeText = (value) => (typeof value === "string" ? value.trim() : value);

export const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
};

export const getErrorMessage = (error) => error?.message || "";

export const applyServerErrors = (requestError, setError, setFormError) => {
  const response = requestError?.response?.data;

  if (response?.errors && typeof response.errors === "object") {
    Object.entries(response.errors).forEach(([field, message]) => {
      setError(field, { type: "server", message });
    });
    return;
  }

  setFormError(response?.message || "Something went wrong");
};

export const requiredRule = (message) => ({
  required: message,
});

export const textRules = (label, { min = 1, max = 100, required = true } = {}) => {
  const rules = {
    minLength: {
      value: min,
      message: `${label} must be at least ${min} characters`,
    },
    maxLength: {
      value: max,
      message: `${label} must be at most ${max} characters`,
    },
    setValueAs: normalizeText,
  };

  if (required) {
    rules.required = `${label} is required`;
  }

  return rules;
};

export const emailRules = ({ required = true } = {}) => {
  const rules = {
    pattern: {
      value: EMAIL_REGEX,
      message: "Valid email is required",
    },
    setValueAs: (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  };

  if (required) {
    rules.required = "Email is required";
  }

  return rules;
};

export const phoneRules = ({ required = true, requiredMessage = "Phone number is required", invalidMessage = "Valid Indian mobile number is required" } = {}) => {
  const rules = {
    pattern: {
      value: INDIAN_PHONE_REGEX,
      message: invalidMessage,
    },
    setValueAs: (value) => (typeof value === "string" ? value.trim() : value),
  };

  if (required) {
    rules.required = requiredMessage;
  }

  return rules;
};

export const passwordRules = () => ({
  required: "Password is required",
  minLength: {
    value: 8,
    message: "Password must be at least 8 characters",
  },
  maxLength: {
    value: 32,
    message: "Password must be at most 32 characters",
  },
  pattern: {
    value: PASSWORD_REGEX,
    message: "Password must include uppercase, lowercase, number, and special character",
  },
});

export const selectRules = (label, { requiredMessage } = {}) => ({
  required: requiredMessage || `${label} is required`,
});

export const numberRules = (label, { required = false, min = 0, integer = false } = {}) => ({
  ...(required ? { required: `${label} is required` } : {}),
  validate: (value) => {
    if (value === "" || value === null || value === undefined) {
      return required ? `${label} is required` : true;
    }

    if (!NUMBER_REGEX.test(String(value))) {
      return `${label} must be a valid number`;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return `${label} must be a valid number`;
    }

    if (numericValue < min) {
      return `${label} must be at least ${min}`;
    }

    if (integer && !Number.isInteger(numericValue)) {
      return `${label} must be a whole number`;
    }

    return true;
  },
});

export const dateRules = (label, { required = false } = {}) => ({
  ...(required ? { required: `${label} is required` } : {}),
  validate: (value) => {
    if (!value) {
      return required ? `${label} is required` : true;
    }

    return Number.isNaN(new Date(value).getTime()) ? `${label} must be a valid date` : true;
  },
});

export const httpsUrlRules = (label, { required = false } = {}) => ({
  ...(required ? { required: `${label} is required` } : {}),
  validate: (value) => {
    if (!value) {
      return required ? `${label} is required` : true;
    }

    const normalized = typeof value === "string" ? value.trim() : value;
    return HTTPS_URL_REGEX.test(normalized) ? true : `${label} must be a valid https URL`;
  },
  setValueAs: normalizeText,
});
