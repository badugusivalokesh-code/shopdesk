import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { getApiErrorMessage, getCurrentUser, updateMyProfile } from "@/api/shopdesk";
import type { User } from "@/api/types";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ErrorState,
  Input,
  LoadingIndicator,
  PageHeading,
  StatusBadge,
  useToast,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

type ProfileState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: User };

type FieldErrors = {
  name?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type OperationFeedback =
  | { status: "idle" }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type PasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

const EMPTY_PASSWORD_FORM: PasswordForm = {
  confirmPassword: "",
  newPassword: "",
};

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "SD";
}

function getFeedbackClass(status: OperationFeedback["status"]): string {
  if (status === "success") {
    return "text-success";
  }

  if (status === "error") {
    return "text-danger";
  }

  return "text-text-secondary";
}

export default function ProfilePage() {
  const { error: showError, success: showSuccess } = useToast();
  const { refreshUser } = useAuth();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);
  const requestId = useRef(0);
  const submittingRef = useRef(false);
  const [profileState, setProfileState] = useState<ProfileState>({ status: "loading" });
  const [nameDraft, setNameDraft] = useState("");
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [nameFeedback, setNameFeedback] = useState<OperationFeedback>({ status: "idle" });
  const [passwordFeedback, setPasswordFeedback] = useState<OperationFeedback>({ status: "idle" });
  const [isSavingName, setIsSavingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const profile = profileState.status === "success" ? profileState.data : null;

  const loadProfile = useCallback(() => {
    const currentRequestId = ++requestId.current;
    setProfileState({ status: "loading" });

    void getCurrentUser()
      .then((user) => {
        if (requestId.current === currentRequestId) {
          setProfileState({ data: user, status: "success" });
          setNameDraft(user.name);
        }
      })
      .catch((error: unknown) => {
        if (requestId.current === currentRequestId) {
          setProfileState({
            message: getApiErrorMessage(error, "Your profile could not be loaded."),
            status: "error",
          });
        }
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadProfile();

    return () => {
      mountedRef.current = false;
      requestId.current += 1;
    };
  }, [loadProfile]);

  async function refreshSavedProfile(savedUser: User) {
    if (mountedRef.current) {
      setProfileState({ data: savedUser, status: "success" });
      setNameDraft(savedUser.name);
    }

    const refreshedUser = await refreshUser();
    if (!refreshedUser) {
      throw new Error("Your session changed. Sign in again to view your profile.");
    }

    if (mountedRef.current) {
      setProfileState({ data: refreshedUser, status: "success" });
      setNameDraft(refreshedUser.name);
    }
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((errors) => {
      if (!errors[field]) {
        return errors;
      }

      const nextErrors = { ...errors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function handlePasswordChange(
    field: keyof PasswordForm,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setPasswordForm((form) => ({ ...form, [field]: event.target.value }));
    clearFieldError(field);
    if (passwordFeedback.status !== "idle") {
      setPasswordFeedback({ status: "idle" });
    }

    if (field === "newPassword") {
      clearFieldError("confirmPassword");
    }
  }

  async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    const trimmedName = nameDraft.trim();

    if (!trimmedName) {
      setFieldErrors((errors) => ({ ...errors, name: "Name is required." }));
      setNameFeedback({ message: "Enter a name before saving.", status: "error" });
      window.requestAnimationFrame(() => nameInputRef.current?.focus());
      return;
    }

    setFieldErrors((errors) => {
      const nextErrors = { ...errors };
      delete nextErrors.name;
      return nextErrors;
    });
    setNameFeedback({ message: "Saving your display name…", status: "loading" });
    submittingRef.current = true;
    setIsSavingName(true);
    let saved = false;

    try {
      const updatedUser = await updateMyProfile({ name: trimmedName });
      saved = true;
      await refreshSavedProfile(updatedUser);
      if (!mountedRef.current) {
        return;
      }

      setNameFeedback({ message: "Your display name was updated.", status: "success" });
      showSuccess({
        description: "Your account now uses the saved display name.",
        title: "Profile updated",
      });
    } catch (error: unknown) {
      if (!mountedRef.current) {
        return;
      }

      const message = getApiErrorMessage(error, "The display name could not be updated.");
      setNameFeedback({
        message: saved ? `Your name was saved, but profile refresh failed: ${message}` : message,
        status: "error",
      });
      showError({
        description: message,
        title: saved ? "Could not refresh profile" : "Could not update profile",
      });
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) {
        setIsSavingName(false);
      }
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    const { newPassword, confirmPassword } = passwordForm;
    setPasswordForm(EMPTY_PASSWORD_FORM);
    const errors: FieldErrors = {};

    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Use at least 8 characters.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(({ name }) => ({ ...(name ? { name } : {}), ...errors }));
      setPasswordFeedback({ message: "Review the password fields and try again.", status: "error" });
      return;
    }

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.newPassword;
      delete nextErrors.confirmPassword;
      return nextErrors;
    });
    setPasswordFeedback({ message: "Changing password…", status: "loading" });
    submittingRef.current = true;
    setIsChangingPassword(true);
    let saved = false;

    try {
      const updatedUser = await updateMyProfile({ password: newPassword });
      saved = true;
      await refreshSavedProfile(updatedUser);
      if (!mountedRef.current) {
        return;
      }

      setPasswordFeedback({ message: "Your password was changed.", status: "success" });
      showSuccess({
        description: "The password fields have been cleared for your privacy.",
        title: "Password changed",
      });
    } catch (error: unknown) {
      if (!mountedRef.current) {
        return;
      }

      const message = getApiErrorMessage(error, "The password could not be changed.");
      setPasswordFeedback({
        message: saved ? `Your password was changed, but profile refresh failed: ${message}` : message,
        status: "error",
      });
      showError({
        description: message,
        title: saved ? "Could not refresh profile" : "Could not change password",
      });
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) {
        setPasswordForm(EMPTY_PASSWORD_FORM);
        setIsChangingPassword(false);
      }
    }
  }

  return (
    <div className="min-w-0 space-y-8">
      <PageHeading
        description="Review your account details and update your name or password."
        eyebrow="ShopDesk · Profile"
        title="Profile"
      />

      {profileState.status === "loading" ? (
        <Card className="min-w-0">
          <CardContent className="flex min-h-[260px] items-center justify-center sm:min-h-[280px]">
            <LoadingIndicator label="Loading profile" showLabel size="lg" />
          </CardContent>
        </Card>
      ) : null}

      {profileState.status === "error" ? (
        <ErrorState
          description={profileState.message}
          onRetry={loadProfile}
          retryLabel="Retry profile load"
          title="Your profile is unavailable"
        />
      ) : null}

      {profile ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <Card className="min-w-0">
            <CardHeader className="min-h-[88px]">
              <div>
                <CardTitle>Your profile</CardTitle>
                <CardDescription>Your current account details.</CardDescription>
              </div>
              <StatusBadge label="Account" size="sm" status="success" tone="success" />
            </CardHeader>
            <CardContent className="p-6 sm:p-7">
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div
                  aria-label={`Avatar for ${profile.name}`}
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-brand-foreground ring-8 ring-brand/10 sm:h-24 sm:w-24 sm:text-2xl"
                  role="img"
                >
                  {getInitials(profile.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold tracking-tight text-text-primary">{profile.name}</h2>
                  <p className="mt-1 break-all text-sm text-text-secondary">{profile.email}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Avatar initials · {getInitials(profile.name)}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="min-h-[72px]">
              <p className="text-xs leading-5 text-text-secondary">
                Your email address is linked to this account and cannot be changed here.
              </p>
            </CardFooter>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="min-h-[88px]">
              <div>
                <CardTitle>Personal details</CardTitle>
                <CardDescription>Keep your display name easy to recognize.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-7">
              <form className="max-w-xl space-y-5" noValidate onSubmit={handleNameSubmit}>
                <Input
                  autoComplete="name"
                  disabled={isSavingName || isChangingPassword}
                  error={fieldErrors.name}
                  id="profile-name"
                  label="Name"
                  onChange={(event) => {
                    setNameDraft(event.target.value);
                    clearFieldError("name");
                    if (nameFeedback.status !== "idle") {
                      setNameFeedback({ status: "idle" });
                    }
                  }}
                  ref={nameInputRef}
                  required
                  value={nameDraft}
                />
                <Input
                  autoComplete="email"
                  className="bg-surface-secondary text-text-secondary"
                  disabled
                  id="profile-email"
                  label="Email"
                  value={profile.email}
                />
                <div aria-live="polite" className="min-h-11">
                  {nameFeedback.status === "loading" ? (
                    <LoadingIndicator label={nameFeedback.message} showLabel size="sm" />
                  ) : nameFeedback.status !== "idle" ? (
                    <p
                      className={`rounded-control border border-border bg-surface-secondary px-3 py-2 text-sm leading-5 ${getFeedbackClass(nameFeedback.status)}`}
                      role={nameFeedback.status === "error" ? "alert" : "status"}
                    >
                      {nameFeedback.message}
                    </p>
                  ) : null}
                </div>
                <Button className="w-full sm:w-auto" disabled={isChangingPassword} loading={isSavingName} loadingLabel="Saving profile" type="submit">
                  Save name
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="min-w-0 xl:col-span-2">
            <CardHeader className="min-h-[88px]">
              <div>
                <CardTitle>Change password</CardTitle>
                <CardDescription>
                  Set a new password of at least 8 characters. Password fields are cleared after submission.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-7">
              <form className="max-w-3xl grid gap-5 md:grid-cols-2" noValidate onSubmit={handlePasswordSubmit}>
                <Input
                  autoComplete="new-password"
                  disabled={isSavingName || isChangingPassword}
                  error={fieldErrors.newPassword}
                  hint="At least 8 characters."
                  id="new-password"
                  label="New password"
                  minLength={8}
                  onChange={(event) => handlePasswordChange("newPassword", event)}
                  required
                  type="password"
                  value={passwordForm.newPassword}
                />
                <Input
                  autoComplete="new-password"
                  disabled={isSavingName || isChangingPassword}
                  error={fieldErrors.confirmPassword}
                  id="confirm-password"
                  label="Confirm new password"
                  onChange={(event) => handlePasswordChange("confirmPassword", event)}
                  required
                  type="password"
                  value={passwordForm.confirmPassword}
                />
                <div aria-live="polite" className="min-h-6 md:col-span-2">
                  {passwordFeedback.status === "loading" ? (
                    <LoadingIndicator label={passwordFeedback.message} showLabel size="sm" />
                  ) : passwordFeedback.status !== "idle" ? (
                    <p
                      className={`rounded-control border border-border bg-surface-secondary px-3 py-2 text-sm leading-5 ${getFeedbackClass(passwordFeedback.status)}`}
                      role={passwordFeedback.status === "error" ? "alert" : "status"}
                    >
                      {passwordFeedback.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex justify-start md:col-span-2">
                  <Button className="w-full sm:w-auto" disabled={isSavingName} loading={isChangingPassword} loadingLabel="Changing password" type="submit">
                    Change password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
