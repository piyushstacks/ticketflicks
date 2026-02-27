import { useCallback, useMemo, useRef, useState } from "react";
import { errorId, fieldId, validateSingleField, validateValues } from "../lib/validation.js";

export const useFormValidation = ({ formId, initialValues, schema, options = {} }) => {
  const initialRef = useRef(initialValues);
  const optionsRef = useRef(options);
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const reset = useCallback((nextValues) => {
    initialRef.current = nextValues;
    setValues(nextValues);
    setTouched({});
    setErrors({});
  }, []);

  const setFieldValue = useCallback(
    (name, value, options = {}) => {
      const { touch = false } = options;
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        const shouldValidate = touch || touched[name] || optionsRef.current?.touchOnChange;
        if (shouldValidate) {
          setErrors((prevErrors) => {
            const nextErrors = { ...prevErrors };
            const error = validateSingleField(schema, next, name);
            if (error) nextErrors[name] = error;
            else delete nextErrors[name];
            return nextErrors;
          });
        }
        return next;
      });
    },
    [schema, touched]
  );

  const touchField = useCallback(
    (name) => {
      setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        const nextValues = { ...values };
        const error = validateSingleField(schema, nextValues, name);
        if (error) nextErrors[name] = error;
        else delete nextErrors[name];
        return nextErrors;
      });
    },
    [schema, values]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, type } = e.target;
      if (!name) return;
      if (type === "checkbox") {
        setFieldValue(name, e.target.checked);
        return;
      }
      if (type === "file") {
        const file = e.target.files?.[0] || null;
        setFieldValue(name, file);
        return;
      }
      if (type === "radio") {
        setFieldValue(name, e.target.value, { touch: true });
        return;
      }
      setFieldValue(name, e.target.value);
    },
    [setFieldValue]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      if (!name) return;
      touchField(name);
    },
    [touchField]
  );

  const validateForm = useCallback(
    (options = {}) => {
      const { touchAll = true } = options;
      const nextErrors = validateValues(schema, values);
      setErrors(nextErrors);
      if (touchAll) {
        const nextTouched = {};
        for (const key of Object.keys(schema)) nextTouched[key] = true;
        setTouched((prev) => ({ ...nextTouched, ...prev }));
      }
      return { errors: nextErrors, isValid: Object.keys(nextErrors).length === 0 };
    },
    [schema, values]
  );

  const focusFirstInvalidField = useCallback(
    (nextErrors) => {
      const errs = nextErrors || errors;
      const firstKey = Object.keys(errs)[0];
      if (!firstKey) return;
      const id = fieldId(formId, firstKey);
      const el = typeof document !== "undefined" ? document.getElementById(id) : null;
      if (el && typeof el.focus === "function") el.focus();
    },
    [errors, formId]
  );

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const getError = useCallback((name) => errors[name] || "", [errors]);
  const isTouched = useCallback((name) => !!touched[name], [touched]);

  const getInputProps = useCallback(
    (name, extra = {}) => {
      const id = fieldId(formId, name);
      const errId = errorId(formId, name);
      const showError = !!errors[name] && !!touched[name];
      const describedBy = showError ? errId : undefined;
      const ariaInvalid = showError ? "true" : undefined;

      const base = {
        id,
        name,
        onChange: handleChange,
        onBlur: handleBlur,
        "aria-invalid": ariaInvalid,
        "aria-describedby": describedBy,
      };

      if (extra.type === "checkbox") {
        return { ...base, checked: !!values[name], value: undefined, ...extra };
      }
      if (extra.type === "file") {
        return { ...base, value: undefined, ...extra };
      }
      return { ...base, value: values[name] ?? "", ...extra };
    },
    [errors, formId, handleBlur, handleChange, touched, values]
  );

  return {
    values,
    setValues,
    setFieldValue,
    touched,
    touchField,
    errors,
    getError,
    isTouched,
    isValid,
    validateForm,
    focusFirstInvalidField,
    getInputProps,
    reset,
    initialValues: initialRef.current,
  };
};

