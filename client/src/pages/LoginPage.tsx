import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { getApiErrorMessage } from "@/api/shopdesk";
import type { LoginRequest } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import {
  Button,
  Card,
  CardContent,
  Input,
} from "@/components/ui";

type LoginFieldErrors = Partial<Record<keyof LoginRequest, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getLoginErrorMessage(error: unknown): string {
  return getApiErrorMessage(
    error,
    "We couldn’t sign you in. Check your details and try again.",
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function updateField(field: keyof LoginRequest, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
    setSubmitError(null);
  }

  function validateForm(): LoginFieldErrors {
    const errors: LoginFieldErrors = {};
    const email = form.email.trim();

    if (!email) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      errors.password = "Password is required.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError("Review the highlighted fields and try again.");
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      setSubmitError(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-page text-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(30rem,0.92fr)]">
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#312e81] via-[#4f46e5] to-[#6366f1] px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-12 dark:from-[#1e1b4b] dark:via-[#3730a3] dark:to-[#4f46e5]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "linear-gradient(to bottom, black, transparent 78%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 78%)",
            }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/[0.15] blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl" />

          <div className="relative z-10 flex min-h-[26rem] flex-col justify-between gap-12 lg:min-h-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShopDeskMark inverse />
                <span className="text-xl font-bold tracking-tight">ShopDesk</span>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur">
                Operations suite
              </span>
            </div>

            <div className="max-w-xl">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/[0.65]">
                A calmer way to run your store
              </p>
              <h1 className="max-w-lg text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl">
                Everything your shop needs, in one clear view.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/[0.72] sm:text-lg">
                Keep products, orders, and the daily pulse of your business close at hand—without the clutter.
              </p>

              <div className="mt-9 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-4">
                <FeatureRow
                  description="See what needs attention first."
                  icon={<SparkIcon />}
                  title="Priorities, surfaced"
                />
                <FeatureRow
                  description="Move from insight to action quickly."
                  icon={<ArrowUpIcon />}
                  title="Workflows that flow"
                />
                <FeatureRow
                  description="A focused workspace for your team."
                  icon={<ShieldIcon />}
                  title="Built for confidence"
                />
              </div>
            </div>

            <div className="hidden max-w-md lg:block">
              <DashboardMotif />
              <p className="mt-5 text-xs font-medium tracking-wide text-white/[0.55]">
                Designed for the moments that matter in your day.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center bg-surface px-5 py-10 sm:px-10 lg:min-h-screen lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[29rem]">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <ShopDeskMark />
              <div>
                <p className="text-lg font-bold tracking-tight text-text-primary">ShopDesk</p>
                <p className="text-xs font-medium text-text-tertiary">Operations suite</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand">
                Account access
              </p>
              <h2 className="text-3xl font-bold tracking-[-0.035em] text-text-primary sm:text-4xl">
                Welcome back
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary sm:text-base">
                Sign in to pick up where you left off and keep your shop moving.
              </p>
            </div>

            <Card className="rounded-card border-border bg-surface shadow-card dark:shadow-card-dark">
              <CardContent className="p-6 sm:p-8">
                <form className="space-y-5" noValidate onSubmit={handleSubmit}>
                  <Input
                    autoComplete="email"
                    autoFocus
                    error={fieldErrors.email}
                    id="login-email"
                    label="Email address"
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="you@company.com"
                    required
                    type="email"
                    value={form.email}
                  />
                  <Input
                    autoComplete="current-password"
                    error={fieldErrors.password}
                    endAdornment={
                      <button
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="rounded-control p-1.5 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        onClick={() => setShowPassword((visible) => !visible)}
                        type="button"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    }
                    id="login-password"
                    label="Password"
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="Enter your password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                  />

                  <div aria-live="polite" className="min-h-5 pt-1">
                    {submitError ? (
                      <div className="flex items-start gap-2.5 rounded-control border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger" role="alert">
                        <AlertIcon />
                        <span>{submitError}</span>
                      </div>
                    ) : null}
                  </div>

                  <Button className="w-full shadow-lg shadow-brand/20" loading={isSubmitting} loadingLabel="Signing in" size="lg" type="submit">
                    Sign in to ShopDesk
                  </Button>
                </form>

                <div className="mt-6 flex items-start gap-3 border-t border-border pt-5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-brand">
                    <LockIcon />
                  </span>
                  <p className="text-xs leading-5 text-text-tertiary">
                    Your workspace is protected. Use your ShopDesk account credentials to continue.
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="mt-7 text-center text-xs leading-5 text-text-tertiary">
              Need access? Contact your workspace administrator.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}


type FeatureRowProps = {
  description: string;
  icon: ReactNode;
  title: string;
};

function FeatureRow({ description, icon, title }: FeatureRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-panel border border-white/[0.12] bg-white/10 p-3.5 backdrop-blur-sm sm:p-4 lg:border-0 lg:bg-transparent lg:p-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-white/[0.14] text-white">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/[0.58]">{description}</p>
      </div>
    </div>
  );
}

function DashboardMotif() {
  return (
    <div className="relative overflow-hidden rounded-card border border-white/[0.15] bg-black/20 p-4 shadow-card-dark backdrop-blur-md">
      <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">Daily command center</p>
          <p className="mt-1 text-sm font-semibold text-white/90">A clearer view of what is next</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/75">
          <ArrowUpIcon />
        </span>
      </div>
      <div className="relative mt-5 grid grid-cols-[1.1fr_0.9fr] gap-3">
        <div className="rounded-panel border border-white/10 bg-white/[0.08] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-white/[0.48]">Store pulse</span>
            <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_0_4px_rgba(74,222,128,0.1)]" />
          </div>
          <div className="mt-7 flex h-12 items-end gap-1.5">
            <span className="h-5 flex-1 rounded-t bg-white/20" />
            <span className="h-8 flex-1 rounded-t bg-white/30" />
            <span className="h-6 flex-1 rounded-t bg-white/25" />
          <span className="h-10 flex-1 rounded-t bg-brand-light/80" />
            <span className="h-7 flex-1 rounded-t bg-white/30" />
          <span className="h-11 flex-1 rounded-t bg-success/80" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-panel border border-white/10 bg-white/[0.08] p-3">
            <span className="block h-2 w-16 rounded-full bg-white/20" />
            <span className="mt-3 block h-2 w-24 rounded-full bg-white/10" />
            <span className="mt-2 block h-2 w-20 rounded-full bg-white/10" />
          </div>
          <div className="rounded-panel border border-white/10 bg-white/[0.08] p-3">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="h-2 w-2 rounded-full bg-brand-light" />
              <span className="h-2 w-2 rounded-full bg-white/[0.35]" />
            </div>
            <span className="mt-3 block h-2 w-20 rounded-full bg-white/[0.15]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopDeskMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${
        inverse
          ? "bg-white/[0.14] text-white ring-1 ring-inset ring-white/20"
          : "bg-brand text-brand-foreground shadow-card"
      }`}
    >
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path
          d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-11Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M8.5 9.5h7M8.5 12h7M8.5 14.5h4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
    </span>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M3.5 12s3.2-5 8.5-5 8.5 5 8.5 5-3.2 5-8.5 5-8.5-5-8.5-5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m4 4 16 16M10.6 6.9A9.8 9.8 0 0 1 12 7c5.3 0 8.5 5 8.5 5a16.5 16.5 0 0 1-3 3.4M6.2 8.2C4.5 9.4 3.5 12 3.5 12s3.2 5 8.5 5c.7 0 1.4-.1 2-.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect height="9" rx="2" stroke="currentColor" strokeWidth="1.7" width="14" x="5" y="10" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8v4.5m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="m12 3 1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 16 12 9l4 4 3-3M19 10v4h-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 3.5 19 6v5.5c0 4.2-2.5 7.3-7 9-4.5-1.7-7-4.8-7-9V6l7-2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m9.2 12 1.8 1.8 3.8-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}
