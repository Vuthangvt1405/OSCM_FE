"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ConnectStep = "idle" | "waiting" | "success";

type NotificationSettings = {
  newLogin: boolean;
  passwordChanged: boolean;
  twoFactorChanged: boolean;
  newFollower: boolean;
  postReactions: boolean;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  newLogin: true,
  passwordChanged: true,
  twoFactorChanged: true,
  newFollower: false,
  postReactions: false,
};

const EMPTY_PASSWORD_FORM: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const SESSION_ITEMS = [
  { id: "s1", label: "Windows • Chrome • Active now" },
  { id: "s2", label: "Android • Telegram WebView • 2 days ago" },
] as const;

function formatDateTime(value: Date) {
  return value.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function makeToken(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

function makeConnectCode() {
  return `ODYSSEUS-${makeToken(5)}`;
}

function makeRecoveryCode() {
  return makeToken(10);
}

export function useSettingsMockState() {
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramHandle, setTelegramHandle] = useState<string | null>(null);
  const [telegramConnectedAt, setTelegramConnectedAt] = useState<string | null>(
    null,
  );

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectStep, setConnectStep] = useState<ConnectStep>("idle");
  const [connectCode, setConnectCode] = useState(makeConnectCode);

  const [telegramNotificationsEnabled, setTelegramNotificationsEnabled] =
    useState(false);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [lastPasswordChangedAt, setLastPasswordChangedAt] = useState<
    string | null
  >(null);

  const confirmTimeoutRef = useRef<number | null>(null);
  const changePasswordTimeoutRef = useRef<number | null>(null);

  function clearConfirmTimeout() {
    if (confirmTimeoutRef.current !== null) {
      window.clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
  }

  function clearChangePasswordTimeout() {
    if (changePasswordTimeoutRef.current !== null) {
      window.clearTimeout(changePasswordTimeoutRef.current);
      changePasswordTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      clearConfirmTimeout();
      clearChangePasswordTimeout();
    };
  }, []);

  function resetTelegramDependentSettings() {
    setTelegramNotificationsEnabled(false);
    setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
    setTwoFactorEnabled(false);
    setRecoveryCodes([]);
    setLastVerifiedAt(null);
  }

  function requestDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen && connectStep === "waiting") return;
    setConnectDialogOpen(nextOpen);
  }

  function beginConnectFlow() {
    clearConfirmTimeout();
    setConnectCode(makeConnectCode());
    setConnectStep("idle");
    setConnectDialogOpen(true);
  }

  function closeConnectDialog() {
    if (connectStep === "waiting") return;
    setConnectDialogOpen(false);
  }

  async function copyConnectCode() {
    try {
      await navigator.clipboard.writeText(connectCode);
      toast.success("Code copied");
    } catch {
      toast.error("Could not copy code");
    }
  }

  function confirmSentCode() {
    if (connectStep === "waiting") return;
    setConnectStep("waiting");
    clearConfirmTimeout();
    confirmTimeoutRef.current = window.setTimeout(() => {
      confirmTimeoutRef.current = null;
      setConnectStep("success");
      setTelegramConnected(true);
      setTelegramHandle("@odysseus_user");
      setTelegramConnectedAt(formatDateTime(new Date()));
      toast.success("Telegram connected");
    }, 900);
  }

  function disconnectTelegram() {
    const ok = window.confirm(
      "Disconnect Telegram? You may lose access to Telegram 2FA.",
    );
    if (!ok) return;
    clearConfirmTimeout();
    setTelegramConnected(false);
    setTelegramHandle(null);
    setTelegramConnectedAt(null);
    setConnectStep("idle");
    setConnectDialogOpen(false);
    resetTelegramDependentSettings();
    toast.success("Telegram disconnected");
  }

  function testTelegramMessage() {
    toast.success("Test message sent (mock)");
  }

  function setNotificationSetting<K extends keyof NotificationSettings>(
    key: K,
    next: boolean,
  ) {
    setNotificationSettings((prev) => ({ ...prev, [key]: next }));
  }

  function toggleTwoFactor(next: boolean) {
    if (!telegramConnected) return;
    setTwoFactorEnabled(next);
    if (next) {
      setLastVerifiedAt(formatDateTime(new Date()));
      toast.success("2FA enabled (mock)");
      return;
    }
    setRecoveryCodes([]);
    setLastVerifiedAt(null);
    toast.success("2FA disabled (mock)");
  }

  function generateRecoveryCodes() {
    const codes = Array.from({ length: 8 }, () => makeRecoveryCode());
    setRecoveryCodes(codes);
    toast.success("Recovery codes generated (mock)");
  }

  function signOutSession() {
    toast.success("Signed out (mock)");
  }

  function signOutAllSessions() {
    toast.success("Signed out all devices (mock)");
  }

  function requestPasswordDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen && isChangingPassword) return;
    setPasswordDialogOpen(nextOpen);
  }

  function beginPasswordChangeFlow() {
    clearChangePasswordTimeout();
    setPasswordDialogOpen(true);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordError(null);
    setIsChangingPassword(false);
  }

  function closePasswordDialog() {
    if (isChangingPassword) return;
    setPasswordDialogOpen(false);
    setPasswordError(null);
  }

  function updatePasswordField<K extends keyof PasswordForm>(
    key: K,
    value: string,
  ) {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    if (passwordError) setPasswordError(null);
  }

  function submitPasswordChange() {
    if (isChangingPassword) return;

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Password confirmation does not match.");
      return;
    }

    setPasswordError(null);
    setIsChangingPassword(true);
    clearChangePasswordTimeout();
    changePasswordTimeoutRef.current = window.setTimeout(() => {
      changePasswordTimeoutRef.current = null;
      setIsChangingPassword(false);
      setPasswordDialogOpen(false);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setLastPasswordChangedAt(formatDateTime(new Date()));
      setNotificationSetting("passwordChanged", true);
      toast.success("Password updated (mock)");
    }, 900);
  }

  return {
    telegramConnected,
    telegramHandle,
    telegramConnectedAt,
    connectDialogOpen,
    connectStep,
    connectCode,
    telegramReady: telegramConnected,
    telegramNotificationsEnabled,
    notificationSettings,
    twoFactorEnabled,
    recoveryCodes,
    lastVerifiedAt,
    passwordDialogOpen,
    passwordForm,
    passwordError,
    isChangingPassword,
    lastPasswordChangedAt,
    sessions: SESSION_ITEMS,
    beginConnectFlow,
    closeConnectDialog,
    requestDialogOpenChange,
    copyConnectCode,
    confirmSentCode,
    disconnectTelegram,
    testTelegramMessage,
    setTelegramNotificationsEnabled,
    setNotificationSetting,
    toggleTwoFactor,
    generateRecoveryCodes,
    signOutSession,
    signOutAllSessions,
    requestPasswordDialogOpenChange,
    beginPasswordChangeFlow,
    closePasswordDialog,
    updatePasswordField,
    submitPasswordChange,
  };
}
