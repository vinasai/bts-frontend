// src/components/Input.tsx
import { useMemo, useState, useEffect } from "react";
import {
  Input as AntInput,
  type InputProps,
  InputNumber as AntInputNumber,
} from "antd";
// Use the TextArea-specific props to avoid HTMLInputElement vs HTMLTextAreaElement mismatch
import type { TextAreaProps as AntTextAreaProps } from "antd/es/input/TextArea";
import type { RcFile, UploadFile } from "antd/es/upload/interface";

/* --------------------------------------------------------------------------
 * Shared utils: lightweight sanitizers & validators (allow-list approach)
 * -------------------------------------------------------------------------- */

export function sanitizeText(
  value: string,
  {
    allowNewlines = false,
    maxLength,
    preserveSpaces = true,
    trim = false,
  }: {
    allowNewlines?: boolean;
    maxLength?: number;
    preserveSpaces?: boolean;
    trim?: boolean;
  } = {}
) {
  if (value == null) return "";
  let v = String(value)
    .normalize("NFKC")
    .replace(/\r\n?|\u0000/g, "\n");

  if (!allowNewlines) v = v.replace(/\n+/g, " ");
  v = v.replace(/[<>`]/g, "");
  v = v.replace(/\t/g, " ");
  v = v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Only collapse spaces if asked
  if (!preserveSpaces) v = v.replace(/\s{2,}/g, " ");

  if (typeof maxLength === "number" && v.length > maxLength)
    v = v.slice(0, maxLength);
  if (trim) v = v.trim();

  return v;
}

export function validateEmail(value: string): boolean {
  // Conservative RFC5322-ish check; avoids catastrophic backtracking
  const v = value.trim();
  if (v.length > 254) return false;
  const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return re.test(v);
}

export function digitsOnly(value: string): string {
  return (value || "").replace(/\D+/g, "");
}

// Canadian phone: country code +1 and 10-digit NANP numbers (no 911 etc. logic here)
export function validateCanadianPhone(raw: string): boolean {
  const d = digitsOnly(raw);
  // Accept 10 digits or 11 starting with 1
  const ten = d.length === 10;
  const eleven = d.length === 11 && d.startsWith("1");
  // Disallow area/exchange starting with 0/1 per NANP rules
  const core = eleven ? d.slice(1) : d;
  if (!(ten || eleven)) return false;
  if (!/^([2-9]\d{2})([2-9]\d{2})(\d{4})$/.test(core)) return false;
  return true;
}

export function formatCanadianPhone(raw: string): string {
  const d = digitsOnly(raw).slice(-11); // last up to 11 digits
  let core = d;
  if (d.length === 11 && d.startsWith("1")) core = d.slice(1);
  if (core.length < 4) return core; // 2-3 chars: just show
  if (core.length < 7) return `(${core.slice(0, 3)}) ${core.slice(3)}`;
  return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6, 10)}`;
}

/* --------------------------------------------------------------------------
 * Base Input + Variants
 * -------------------------------------------------------------------------- */

type Props = InputProps & { label?: string };

function baseClasses(extra?: string) {
  return [
    "!w-full !rounded-md",
    "!border !border-gray-300 focus:!border-primary focus:!ring-0.5 focus:!ring-primary",
    extra || "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Input({
  label,
  className,
  onChange,
  value,
  ...props
}: Props) {
  const [local, setLocal] = useState<string | undefined>(
    typeof value === "string"
      ? sanitizeText(value, { preserveSpaces: true })
      : (value as any)
  );

  useEffect(() => {
    if (typeof value === "string")
      setLocal(sanitizeText(value, { preserveSpaces: true }));
    else setLocal(value as any);
  }, [value]);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <AntInput
        {...props}
        value={local}
        onChange={(e) => {
          const sanitized = sanitizeText(e.target.value, {
            preserveSpaces: true,
          });
          setLocal(sanitized);
          onChange?.({
            ...e,
            target: { ...e.target, value: sanitized },
          } as any);
        }}
        className={baseClasses(className)}
      />
    </div>
  );
}

// Password variant with the same styling + AntD visibility toggle
export function PasswordInput({
  label,
  className,
  onChange,
  value,
  ...props
}: Props) {
  const [local, setLocal] = useState<string | undefined>(
    typeof value === "string" ? sanitizeText(value) : (value as any)
  );

  useEffect(() => {
    if (typeof value === "string") setLocal(sanitizeText(value));
    else setLocal(value as any);
  }, [value]);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <AntInput.Password
        {...props}
        value={local}
        onChange={(e) => {
          // sanitize & remove spaces
          const sanitized = sanitizeText(e.target.value).replace(/\s+/g, "");
          setLocal(sanitized);
          onChange?.({
            ...e,
            target: { ...e.target, value: sanitized },
          } as any);
        }}
        className={baseClasses(className)}
      />
    </div>
  );
}

/* -------------------------------- NumberInput ------------------------------- */

export type NumberInputProps = {
  label?: string;
  className?: string;
  value?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  integerOnly?: boolean; // if true, restrict to integers
  placeholder?: string;
  disabled?: boolean;
};

export function NumberInput({
  label,
  className,
  value,
  onChange,
  min,
  max,
  step,
  integerOnly,
  placeholder,
  disabled,
}: NumberInputProps) {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <AntInputNumber
        value={value as any}
        onChange={(v) => {
          const num = typeof v === "number" ? v : v == null ? null : Number(v);
          if (Number.isNaN(num as any)) return; // ignore invalid
          if (integerOnly && typeof num === "number" && !Number.isInteger(num))
            return; // prevent decimals
          onChange?.(num as any);
        }}
        min={min}
        max={max}
        step={step ?? (integerOnly ? 1 : undefined)}
        placeholder={placeholder}
        disabled={disabled}
        className={baseClasses(className)}
        controls
        stringMode={false}
        inputMode={integerOnly ? "numeric" : "decimal"}
      />
    </div>
  );
}

/* ----------------------------- PhoneInputCanada ----------------------------- */

export type PhoneInputCanadaProps = Omit<Props, "onChange" | "value"> & {
  value?: string; // accepts: "+14165550123", "14165550123", "4165550123"
  onChange?: (value: string) => void; // emits E.164: "+1XXXXXXXXXX" or ""
  required?: boolean;
  showValidation?: boolean;
};

function normalizeCore10(input: string): string {
  // 1) Strip all non-digits
  let d = digitsOnly(input);

  // 2) If user pasted/typed 11+ digits starting with '1', drop that country code
  if (d.length >= 11 && d.startsWith("1")) d = d.slice(1);

  // 3) If user tries to start core with '1' (country code) while we already show +1,
  //    drop that leading 1 so it doesn't duplicate the country code visually or in form
  d = d.replace(/^1/, "");

  // 4) Limit to 10-digit national number
  return d.slice(0, 10);
}

function formatCore(core: string): string {
  if (!core) return "";
  if (core.length < 4) return core;
  if (core.length < 7) return `(${core.slice(0, 3)}) ${core.slice(3)}`;
  return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6, 10)}`;
}

export function PhoneInputCanada({
  label,
  className,
  value,
  onChange,
  required,
  showValidation,
  ...props
}: PhoneInputCanadaProps) {
  // Keep ONLY the 10-digit national number in state.
  const [core, setCore] = useState<string>(normalizeCore10(value || ""));

  // Keep in sync with external value (Form control)
  useEffect(() => {
    setCore(normalizeCore10(value || ""));
  }, [value]);

  const display = useMemo(() => formatCore(core), [core]);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <AntInput
        {...props}
        // IMPORTANT: "+1" is NOT part of the input's value; it's purely visual
        addonBefore="+1"
        value={display}
        inputMode="tel"
        autoComplete="tel"
        placeholder={props.placeholder ?? "(###) ###-####"}
        onChange={(e) => {
          const nextCore = normalizeCore10(e.target.value);
          setCore(nextCore);
          // Emit E.164 to the Form
          onChange?.((nextCore ? `+1${nextCore}` : "") as any);
        }}
        onBlur={() => setCore((c) => normalizeCore10(c))}
        className={baseClasses([className].filter(Boolean).join(" "))}
      />
    </div>
  );
}

/* -------------------------------- EmailInput -------------------------------- */

export type EmailInputProps = Omit<Props, "onChange" | "value"> & {
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  showValidation?: boolean;
};

export function EmailInput({
  label,
  className,
  value,
  onChange,
  required,
  showValidation,
  ...props
}: EmailInputProps) {
  const [local, setLocal] = useState<string>(value || "");
  const clean = useMemo(() => sanitizeText(local), [local]);

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <AntInput
        {...props}
        type="email"
        inputMode="email"
        value={clean}
        onChange={(e) => {
          const v = sanitizeText(e.target.value);
          setLocal(v);
          onChange?.(v as any);
        }}
        onBlur={() => setLocal((v) => v.trim())}
        placeholder={props.placeholder ?? "name@example.com"}
        autoComplete="email"
        className={baseClasses([className].filter(Boolean).join(" "))}
      />
    </div>
  );
}

/* -------------------------------- TextArea --------------------------------- */

// Use AntD's TextArea prop type, but expose a value/onChange that work with sanitized string
export type MyTextAreaProps = Omit<AntTextAreaProps, "value" | "onChange"> & {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  allowNewlines?: boolean;
  maxLength?: number;
  preserveSpaces?: boolean;
  trimOnBlur?: boolean;
};

export function TextArea({
  label,
  className,
  value,
  onChange,
  allowNewlines = true,
  maxLength,
  preserveSpaces = true,
  trimOnBlur = false,
  ...props
}: MyTextAreaProps) {
  const [local, setLocal] = useState<string>(value || "");

  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <AntInput.TextArea
        {...props}
        value={local}
        onChange={(e) => {
          const v = sanitizeText(e.target.value, {
            allowNewlines,
            preserveSpaces,
          });
          const limited =
            typeof maxLength === "number" ? v.slice(0, maxLength) : v;
          setLocal(limited);
          onChange?.(limited);
        }}
        onBlur={() =>
          setLocal((v) =>
            sanitizeText(v, { allowNewlines, preserveSpaces, trim: trimOnBlur })
          )
        }
        className={baseClasses(className)}
        autoSize={{ minRows: 3 }}
        maxLength={maxLength}
        showCount={typeof maxLength === "number"}
      />
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Media (image) validation helpers
 * -------------------------------------------------------------------------- */

export type ImageValidationOptions = {
  /** Max file size in bytes (default: 5 MB) */
  maxBytes?: number;
  /** Allowed MIME types (default: common web image types) */
  allowedTypes?: string[];
  /** Minimum pixel dimensions (optional) */
  minWidth?: number;
  minHeight?: number;
  /** Maximum pixel dimensions (optional) */
  maxWidth?: number;
  maxHeight?: number;
};

export type ImageValidationResult = {
  ok: boolean;
  error?: string;
  meta?: {
    width?: number;
    height?: number;
    bytes: number;
    type?: string;
    name?: string;
  };
};

/** Default allow-list of image types */
export const DEFAULT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  // Note: HEIC/HEIF may not decode in browser but you might still accept uploads:
  "image/heic",
  "image/heif",
];

/** Read natural width/height of an image Blob using an object URL */
async function readImageDimensions(
  file: Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const meta = {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      };
      URL.revokeObjectURL(url);
      resolve(meta);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image dimensions."));
    };
    img.src = url;
  });
}

function bytesToHuman(n: number) {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Validate a browser File/Blob or AntD UploadFile for type, size, and (optionally) dimensions.
 * Use it in Upload.beforeUpload or as part of a custom validator.
 */
export async function validateImageFile(
  file: File | Blob | UploadFile | RcFile,
  opts: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const {
    maxBytes = 5 * 1024 * 1024, // 5MB
    allowedTypes = DEFAULT_IMAGE_TYPES,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
  } = opts;

  // Normalize to a Blob / File to inspect
  let blob: Blob | File | undefined;
  let name: string | undefined;
  let type: string | undefined;
  let size: number | undefined;

  if (file instanceof Blob || file instanceof File) {
    blob = file;
    type = (file as File).type;
    size = file.size;
    name = (file as File).name;
  } else if (typeof (file as UploadFile).uid === "string") {
    const uf = file as UploadFile;
    blob = uf.originFileObj as RcFile | undefined;
    type = (uf as any).type || (blob as any)?.type;
    size = (uf as any).size || (blob as any)?.size;
    name = uf.name;
  }

  // Fallbacks if info missing
  type = type || "";
  size = size ?? 0;

  // Quick checks: size & type
  if (size > maxBytes) {
    return {
      ok: false,
      error: `Image is too large. Max ${bytesToHuman(maxBytes)} allowed.`,
      meta: { bytes: size, type, name },
    };
  }
  if (allowedTypes.length && !allowedTypes.includes(type)) {
    return {
      ok: false,
      error: `Unsupported image type. Allowed: ${allowedTypes.join(", ")}`,
      meta: { bytes: size, type, name },
    };
  }

  // Dimension checks (best-effort). If browser can't decode (e.g., HEIC), skip dimension checks.
  if (blob && (minWidth || minHeight || maxWidth || maxHeight)) {
    try {
      const { width, height } = await readImageDimensions(blob);
      if (minWidth && width < minWidth) {
        return {
          ok: false,
          error: `Image width must be at least ${minWidth}px.`,
          meta: { width, height, bytes: size, type, name },
        };
      }
      if (minHeight && height < minHeight) {
        return {
          ok: false,
          error: `Image height must be at least ${minHeight}px.`,
          meta: { width, height, bytes: size, type, name },
        };
      }
      if (maxWidth && width > maxWidth) {
        return {
          ok: false,
          error: `Image width must be at most ${maxWidth}px.`,
          meta: { width, height, bytes: size, type, name },
        };
      }
      if (maxHeight && height > maxHeight) {
        return {
          ok: false,
          error: `Image height must be at most ${maxHeight}px.`,
          meta: { width, height, bytes: size, type, name },
        };
      }
      return { ok: true, meta: { width, height, bytes: size, type, name } };
    } catch {
      // If dimensions can't be read (e.g., HEIC), accept based on type/size only
      return { ok: true, meta: { bytes: size, type, name } };
    }
  }

  return { ok: true, meta: { bytes: size, type, name } };
}

/**
 * Convenience wrapper for AntD Upload.beforeUpload
 * - Returns `Upload.LIST_IGNORE` on failure to block adding file
 * - Returns `false` on success to keep file in the list but prevent auto-upload
 *
 * Example:
 * <Upload beforeUpload={imageBeforeUpload({ maxBytes: 8 * 1024 * 1024, minWidth: 800, minHeight: 600 })} ... />
 */
export function imageBeforeUpload(opts: ImageValidationOptions = {}) {
  return async (file: RcFile) => {
    const result = await validateImageFile(file, opts);
    if (!result.ok) {
      // We intentionally avoid importing `message` here to keep this module UI-agnostic.
      // Show the error where you call this function, or swap this line for message.error(result.error!)
      console.error(result.error);
      // Tell AntD to ignore this file
      return (window as any).Upload?.LIST_IGNORE ?? "data:image/ignore"; // fallback if constant not available
    }
    // prevent auto-upload; you already used `beforeUpload={() => false}`
    return false;
  };
}
