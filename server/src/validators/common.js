import mongoose from "mongoose";

import { ApiError } from "../utils/ApiError.js";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,32}$/;
export const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
export const ASSET_URL_REGEX = /^(https?:\/\/[^\s/$.?#].[^\s]*|\/[^\s]+)$/i;

export const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

export const setError = (errors, field, message) => {
  if (!errors[field]) {
    errors[field] = message;
  }
};

export const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
};

export const validateRequiredText = (errors, field, value, { label, min, max, lowercase = false }) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    setError(errors, field, `${label} is required`);
    return "";
  }

  if (min && normalized.length < min) {
    setError(errors, field, `${label} must be at least ${min} characters`);
  }

  if (max && normalized.length > max) {
    setError(errors, field, `${label} must be at most ${max} characters`);
  }

  return lowercase ? normalized.toLowerCase() : normalized;
};

export const validateOptionalText = (errors, field, value, { label, min = 0, max }) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  if (min && normalized.length < min) {
    setError(errors, field, `${label} must be at least ${min} characters`);
  }

  if (max && normalized.length > max) {
    setError(errors, field, `${label} must be at most ${max} characters`);
  }

  return normalized;
};

export const validateEmail = (errors, field, value, { required = true } = {}) => {
  const normalized = normalizeString(value).toLowerCase();

  if (!normalized) {
    if (required) {
      setError(errors, field, "Valid email is required");
    }
    return "";
  }

  if (!EMAIL_REGEX.test(normalized)) {
    setError(errors, field, "Valid email is required");
  }

  return normalized;
};

export const validatePhone = (
  errors,
  field,
  value,
  { required = true, requiredMessage = "Valid Indian mobile number is required", invalidMessage = "Valid Indian mobile number is required" } = {}
) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    if (required) {
      setError(errors, field, requiredMessage);
    }
    return "";
  }

  if (!INDIAN_PHONE_REGEX.test(normalized)) {
    setError(errors, field, invalidMessage);
  }

  return normalized;
};

export const validatePassword = (errors, field, value) => {
  const normalized = String(value || "");

  if (!normalized) {
    setError(errors, field, "Password is required");
    return "";
  }

  if (!PASSWORD_REGEX.test(normalized)) {
    setError(errors, field, "Password must include uppercase, lowercase, number, and special character");
  }

  return normalized;
};

export const validateEnum = (errors, field, value, { label, values, required = true }) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    if (required) {
      setError(errors, field, `${label} is required`);
    }
    return "";
  }

  if (!values.includes(normalized)) {
    setError(errors, field, `${label} is invalid`);
  }

  return normalized;
};

export const validateNumber = (errors, field, value, { label, required = false, min, max, integer = false } = {}) => {
  const parsed = toOptionalNumber(value);

  if (parsed === undefined) {
    if (required) {
      setError(errors, field, `${label} is required`);
    }
    return undefined;
  }

  if (Number.isNaN(parsed)) {
    setError(errors, field, `${label} must be a valid number`);
    return undefined;
  }

  if (integer && !Number.isInteger(parsed)) {
    setError(errors, field, `${label} must be a whole number`);
  }

  if (min !== undefined && parsed < min) {
    setError(errors, field, `${label} must be at least ${min}`);
  }

  if (max !== undefined && parsed > max) {
    setError(errors, field, `${label} must be at most ${max}`);
  }

  return parsed;
};

export const validateDate = (errors, field, value, { label, required = false, future = false } = {}) => {
  if (!value) {
    if (required) {
      setError(errors, field, `${label} is required`);
    }
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    setError(errors, field, `${label} must be a valid date`);
    return undefined;
  }

  if (future && date <= new Date()) {
    setError(errors, field, `${label} must be in the future`);
  }

  return date;
};

export const validateOptionalUrl = (errors, field, value, label) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  if (!URL_REGEX.test(normalized)) {
    setError(errors, field, `${label} must be a valid URL`);
  }

  return normalized;
};

export const validateOptionalAssetUrl = (errors, field, value, label) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  if (!ASSET_URL_REGEX.test(normalized)) {
    setError(errors, field, `${label} must be a valid URL`);
  }

  return normalized;
};

export const validateObjectId = (errors, field, value, { label, required = true } = {}) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    if (required) {
      setError(errors, field, `${label} is required`);
    }
    return "";
  }

  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    setError(errors, field, `${label} is invalid`);
  }

  return normalized;
};

export const throwIfValidationFailed = (errors) => {
  if (Object.keys(errors).length) {
    throw new ApiError(400, "Validation failed", null, errors);
  }
};
