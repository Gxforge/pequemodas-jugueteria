import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface BaseFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  requiredMark?: boolean;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, requiredMark, id, type, className = '', ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descId = `${inputId}-desc`;
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-slate-800"
          >
            {label}
            {requiredMark && <span className="text-brand-600 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error || hint ? descId : undefined}
            className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
              isPassword ? 'pr-24' : ''
            } ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
            } disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-700 transition-colors"
            >
              {showPassword ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Ocultar</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Ver</span>
                </>
              )}
            </button>
          )}
        </div>
        {error ? (
          <p id={descId} role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        ) : hint ? (
          <p id={descId} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, requiredMark, id, className = '', rows = 3, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descId = `${inputId}-desc`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-slate-800"
          >
            {label}
            {requiredMark && <span className="text-brand-600 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error || hint ? descId : undefined}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
          } disabled:bg-slate-100 ${className}`}
          {...rest}
        />
        {error ? (
          <p id={descId} role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        ) : hint ? (
          <p id={descId} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, requiredMark, options, id, className = '', ...rest }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const descId = `${selectId}-desc`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-semibold text-slate-800"
          >
            {label}
            {requiredMark && <span className="text-brand-600 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error || hint ? descId : undefined}
          className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-sm sm:text-base text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
          } disabled:bg-slate-100 ${className}`}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p id={descId} role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        ) : hint ? (
          <p id={descId} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';
