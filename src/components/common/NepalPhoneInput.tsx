import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Phone } from 'lucide-react';
import {
  NEPAL_COUNTRY_CODE,
  NEPAL_PHONE_ERROR_MESSAGE,
  extractNepalLocalMobile,
  isValidNepalMobile,
  getNepalMobileValidationError,
  formatFullNepalMobile
} from '../../utils/nepalPhone';

export interface NepalPhoneInputProps {
  value: string;
  onChange: (fullPhone: string, localDigits: string, isValid: boolean) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string | null;
  helperText?: string;
  id?: string;
  className?: string;
  autoFocus?: boolean;
  showHelper?: boolean;
}

export const NepalPhoneInput: React.FC<NepalPhoneInputProps> = ({
  value,
  onChange,
  label = 'Nepal Mobile Number',
  required = true,
  disabled = false,
  placeholder = '98XXXXXXXX / 97XXXXXXXX',
  error,
  helperText,
  id = 'nepal-phone-input',
  className = '',
  autoFocus = false,
  showHelper = true
}) => {
  const initialLocal = extractNepalLocalMobile(value).slice(0, 10);
  const [digits, setDigits] = useState(initialLocal);
  const [touched, setTouched] = useState(false);

  // Sync if parent updates value from outside
  useEffect(() => {
    const parentLocal = extractNepalLocalMobile(value).slice(0, 10);
    if (parentLocal !== digits) {
      setDigits(parentLocal);
    }
  }, [value]);

  const isValid = isValidNepalMobile(digits);
  const liveError = touched && digits.length > 0 ? getNepalMobileValidationError(digits) : null;
  const displayError = error || liveError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strictly accept only digits
    const rawVal = e.target.value.replace(/\D/g, '');
    const cleanDigits = rawVal.slice(0, 10);
    setDigits(cleanDigits);

    if (!touched && cleanDigits.length > 0) {
      setTouched(true);
    }

    const valid = isValidNepalMobile(cleanDigits);
    const full = cleanDigits ? formatFullNepalMobile(cleanDigits) : '';
    onChange(full, cleanDigits, valid);
  };

  const handleBlur = () => {
    setTouched(true);
    const valid = isValidNepalMobile(digits);
    const full = digits ? formatFullNepalMobile(digits) : '';
    onChange(full, digits, valid);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-indigo-600" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 font-mono">
            {digits.length}/10 digits
          </span>
        </label>
      )}

      {/* Input container with fixed +977 prefix */}
      <div
        className={`flex items-center rounded-xl sm:rounded-2xl border bg-white overflow-hidden transition-all shadow-2xs ${
          disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''
        } ${
          displayError
            ? 'border-rose-400 ring-2 ring-rose-100'
            : isValid
            ? 'border-emerald-500 ring-2 ring-emerald-50'
            : 'border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100'
        }`}
      >
        {/* Fixed Non-editable Country Code Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100/90 border-r border-slate-200 text-slate-800 select-none shrink-0">
          <span className="text-base leading-none" role="img" aria-label="Nepal Flag">
            🇳🇵
          </span>
          <span className="text-xs font-black text-slate-900 tracking-wide font-mono">
            {NEPAL_COUNTRY_CODE}
          </span>
          <span className="text-slate-300 mx-0.5">|</span>
        </div>

        {/* Local 10-digit number input */}
        <div className="relative flex-1 flex items-center">
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={digits}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder}
            required={required}
            className="w-full px-3 py-2.5 text-sm text-slate-900 font-mono font-bold tracking-wider placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal outline-none bg-transparent"
          />

          {/* Live feedback status icon */}
          <div className="pr-3 flex items-center gap-1.5 shrink-0 text-xs">
            {isValid ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline text-[11px]">Valid</span>
              </span>
            ) : digits.length > 0 ? (
              <span
                className={`font-mono text-xs font-semibold ${
                  digits.length >= 2 && !(digits.startsWith('98') || digits.startsWith('97'))
                    ? 'text-rose-600'
                    : 'text-slate-400'
                }`}
              >
                {digits.length}/10
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Validation Message or Helper */}
      {showHelper && (
        <div className="text-[11px] min-h-[16px]">
          {displayError ? (
            <p className="text-rose-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{displayError}</span>
            </p>
          ) : isValid ? (
            <p className="text-emerald-700 font-semibold flex items-center gap-1">
              <span>✓</span>
              <span>Valid format: +977{digits} (Starts with {digits.slice(0, 2)})</span>
            </p>
          ) : (
            <p className="text-slate-500">
              {helperText || 'Must start with 98 or 97 followed by 8 digits (e.g. +977 98XXXXXXXX).'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
