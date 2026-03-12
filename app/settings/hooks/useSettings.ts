"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getCurrentUser,
  startTelegramVerification,
  type TelegramVerificationStartResponse,
  type CurrentUserResponse,
} from "@/lib/apis/social";

type ConnectStep = "idle" | "loading" | "waiting" | "success" | "error";

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

function makeRecoveryCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 10 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

export function useSettings() {
  // Telegram connection state
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramHandle, setTelegramHandle] = useState<string | null>(null);
  const [telegramConnectedAt, setTelegramConnectedAt] = useState<string | null>(
    null,
  );

  // Verification data from backend
  const [verificationData, setVerificationData] =
    useState<TelegramVerificationStartResponse | null>(null);

  // Dialog state
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectStep, setConnectStep] = useState<ConnectStep>("idle");
  const [connectCode, setConnectCode] = useState<string>("");
  const [deepLink, setDeepLink] = useState<string | null>(null);

  // Other state
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

  // Load initial user data on mount
  useEffect(() => {
    async function loadUserData() {
      try {
        const user = await getCurrentUser();
        if (user.telegramId) {
          setTelegramConnected(true);
          setTelegramHandle(user.telegramId);
          // TODO: Get actual connectedAt from backend if available
          setTelegramConnectedAt(formatDateTime(new Date()));
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    }
    loadUserData();
  }, []);

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

  async function beginConnectFlow() {
    clearConfirmTimeout();
    setConnectStep("loading");
    setConnectDialogOpen(true);

    try {
      const data = await startTelegramVerification();
      setVerificationData(data);
      setConnectCode(data.token);
      setDeepLink(data.deepLink);
      setConnectStep("idle");
    } catch (error) {
      console.error("Failed to start verification:", error);
      toast.error("Failed to start verification. Please try again.");
      setConnectStep("error");
    }
  }

  function closeConnectDialog() {
    if (connectStep === "waiting") return;
    setConnectDialogOpen(false);
    setVerificationData(null);
    setConnectCode("");
    setDeepLink(null);
  }

  async function copyConnectCode() {
    try {
      await navigator.clipboard.writeText(connectCode);
      toast.success("Code copied");
    } catch {
      toast.error("Could not copy code");
    }
  }

  async function copyDeepLink() {
    if (!deepLink) {
      toast.error("No link available");
      return;
    }
    try {
      await navigator.clipboard.writeText(deepLink);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function confirmSentCode() {
    if (connectStep === "waiting") return;
    setConnectStep("waiting");
    clearConfirmTimeout();

    // ONE-TIME check - not polling
    // Wait a moment for user to switch to Telegram and back
    confirmTimeoutRef.current = window.setTimeout(async () => {
      try {
        const user = await getCurrentUser();
        if (user.telegramId) {
          setConnectStep("success");
          setTelegramConnected(true);
          setTelegramHandle(user.telegramId);
          setTelegramConnectedAt(formatDateTime(new Date()));
          toast.success("Telegram connected!");
        } else {
          // Telegram not linked yet
          setConnectStep("idle");
          toast.info("Please send the code to the Telegram bot first");
        }
      } catch (error) {
        console.error("Failed to check telegram status:", error);
        setConnectStep("error");
        toast.error("Failed to verify. Please try again.");
      }
    }, 2000);
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
    // TODO: Implement when backend endpoint is available
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
    deepLink,
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
    copyDeepLink,
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
