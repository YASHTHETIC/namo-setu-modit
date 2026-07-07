"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { cn } from "@foundation/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface FieldError {
  message: string;
  field?: string;
}

export interface FormErrors {
  [key: string]: FieldError;
}

interface FormContextType<T> {
  values: T;
  errors: FormErrors;
  touched: { [key: string]: boolean };
  isSubmitting: boolean;
  isValid: boolean;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setFieldError: (field: string, error: FieldError | null) => void;
  setTouched: (field: string, touched: boolean) => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  resetForm: () => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e: React.FormEvent) => Promise<void>;
}

const FormContext = createContext<FormContextType<any> | undefined>(undefined);

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate?: (values: T) => FormErrors | Promise<FormErrors>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when value changes
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldError = useCallback((field: string, error: FieldError | null) => {
    setErrors((prev) => {
      if (error) {
        return { ...prev, [field]: error };
      }
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldTouched = useCallback((field: string, isTouched: boolean) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  const validateField = useCallback(async (field: keyof T) => {
    if (!validate) return true;
    
    const fieldErrors = await validate(values);
    const fieldError = fieldErrors[field as string];
    
    if (fieldError) {
      setFieldError(field as string, fieldError);
      return false;
    }
    
    setFieldError(field as string, null);
    return true;
  }, [values, validate, setFieldError]);

  const validateForm = useCallback(async () => {
    if (!validate) return true;
    
    const formErrors = await validate(values);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [values, validate]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (onSubmit: (values: T) => void | Promise<void>) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      const isValid = await validateForm();
      if (!isValid) return;
      
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validateForm]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setFieldValue,
    setFieldError,
    setTouched: setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    handleSubmit,
  };
}

export function FormProvider<T extends Record<string, any>>({
  children,
  form,
}: {
  children: ReactNode;
  form: FormContextType<T>;
}) {
  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

export function useFormContext<T>() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context as FormContextType<T>;
}

export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

export function FormField({ name, label, required, error, helperText, children }: FormFieldProps) {
  const form = useFormContext<any>();
  const fieldError = error || form.errors[name]?.message;
  const isTouched = form.touched[name];
  const showError = isTouched && fieldError;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {typeof children === "function" ? (
        (children as (props: any) => ReactNode)({
          value: form.values[name],
          onChange: (value: any) => form.setFieldValue(name, value),
          onBlur: () => form.setTouched(name, true),
          error: showError,
        })
      ) : (
        React.cloneElement(children as React.ReactElement<any>, {
          value: form.values[name],
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => form.setFieldValue(name, e.target.value),
          onBlur: () => form.setTouched(name, true),
          error: showError,
        } as any)
      )}
      {showError && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          {fieldError}
        </div>
      )}
      {helperText && !showError && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function FormInput({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm",
        "placeholder:text-slate-400",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
        className
      )}
      {...props}
    />
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function FormTextarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm",
        "placeholder:text-slate-400",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all resize-none",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
        className
      )}
      {...props}
    />
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  children: ReactNode;
}

export function FormSelect({ className, error, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export interface FormActionsProps {
  onCancel?: () => void;
  cancelText?: string;
  submitText?: string;
  isSubmitting?: boolean;
  isValid?: boolean;
}

export function FormActions({
  onCancel,
  cancelText = "Cancel",
  submitText = "Submit",
  isSubmitting = false,
  isValid = true,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
      )}
      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        {submitText}
      </button>
    </div>
  );
}

export function FormSuccess({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      {message}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      {message}
    </div>
  );
}
