"use client";

import {
  Bell,
  CheckCircle2,
  Copy,
  KeyRound,
  Link,
  Loader2,
  MessageCircle,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useSidebarAvailability } from "@/features/sidebar";
import { SettingsCard, StatusPill, ToggleRow } from "./SettingsPrimitives";
import { useSettings } from "../hooks/useSettings";

export function SettingsContent() {
  useSidebarAvailability();

  const {
    telegramConnected,
    telegramHandle,
    telegramConnectedAt,
    connectDialogOpen,
    connectStep,
    connectCode,
    deepLink,
    telegramReady,
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
    sessions,
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
  } = useSettings();

  const notificationGroups = [
    {
      title: "Security",
      items: [
        { key: "newLogin" as const, label: "New login detected" },
        { key: "passwordChanged" as const, label: "Password changed" },
        { key: "twoFactorChanged" as const, label: "2FA settings changed" },
      ],
    },
    {
      title: "Social",
      items: [
        { key: "newFollower" as const, label: "New follower" },
        { key: "postReactions" as const, label: "Post reactions" },
      ],
    },
  ] as const;

  return (
    <div className="flex flex-1 overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-6xl overflow-hidden px-4">
          <div className="box-border h-full py-8">
            <div className="mx-auto h-full max-w-3xl">
              <div className="h-full overflow-y-auto scrollbar-hidden">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-900">
                    Settings
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Security & privacy controls (mock UI)
                  </p>
                </div>

                <div className="space-y-6">
                  <SettingsCard
                    title="Telegram"
                    description="Connect Telegram to receive security alerts and enable 2FA."
                    Icon={MessageCircle}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-slate-600">Status</div>
                        <StatusPill connected={telegramConnected} />
                      </div>
                      <div className="flex items-center gap-2">
                        {telegramConnected ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={testTelegramMessage}
                            >
                              Test message
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={disconnectTelegram}
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="bg-orange-500 text-white hover:bg-orange-600"
                            onClick={beginConnectFlow}
                          >
                            Connect Telegram
                          </Button>
                        )}
                      </div>
                    </div>

                    {telegramConnected ? (
                      <>
                        <Separator className="my-5" />
                        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Connected as
                            </div>
                            <div className="mt-1 font-medium text-slate-900">
                              {telegramHandle}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Connected on
                            </div>
                            <div className="mt-1 font-medium text-slate-900">
                              {telegramConnectedAt}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </SettingsCard>

                  <SettingsCard
                    title="Password"
                    description="Change your sign-in password to keep your account secure."
                    Icon={KeyRound}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          Account password
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {lastPasswordChangedAt
                            ? `Last changed: ${lastPasswordChangedAt}`
                            : "No recent password change recorded."}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={beginPasswordChangeFlow}
                      >
                        Change password
                      </Button>
                    </div>
                  </SettingsCard>

                  <SettingsCard
                    title="Notifications (Telegram)"
                    description="Choose which events should send a Telegram message."
                    Icon={Bell}
                  >
                    <ToggleRow
                      label="Enable Telegram notifications"
                      description={
                        telegramReady
                          ? "Controls all Telegram notification categories."
                          : "Connect Telegram to enable."
                      }
                      checked={telegramNotificationsEnabled}
                      disabled={!telegramReady}
                      onChange={setTelegramNotificationsEnabled}
                    />

                    <Separator className="my-5" />

                    <div className="space-y-4">
                      {notificationGroups.map((group, groupIndex) => (
                        <div key={group.title}>
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {group.title}
                          </div>
                          <div className="mt-4 space-y-4">
                            {group.items.map((item) => (
                              <ToggleRow
                                key={item.key}
                                label={item.label}
                                checked={notificationSettings[item.key]}
                                disabled={
                                  !telegramReady ||
                                  !telegramNotificationsEnabled
                                }
                                onChange={(next) =>
                                  setNotificationSetting(item.key, next)
                                }
                              />
                            ))}
                          </div>
                          {groupIndex < notificationGroups.length - 1 ? (
                            <Separator className="my-5" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </SettingsCard>

                  <SettingsCard
                    title="Two-factor authentication"
                    description="Require a Telegram approval code when signing in."
                    Icon={twoFactorEnabled ? ShieldCheck : ShieldOff}
                  >
                    <ToggleRow
                      label="Enable 2FA via Telegram"
                      description={
                        telegramReady
                          ? "Adds an extra verification step at sign-in."
                          : "Connect Telegram to enable."
                      }
                      checked={twoFactorEnabled}
                      disabled={!telegramReady}
                      onChange={toggleTwoFactor}
                    />

                    {twoFactorEnabled ? (
                      <>
                        <Separator className="my-5" />
                        <div className="space-y-4">
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="text-sm font-semibold text-amber-900">
                              Don’t lose access
                            </div>
                            <div className="mt-1 text-sm text-amber-800">
                              If you lose Telegram access, recovery codes are
                              required to sign in.
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                Recovery codes
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                Generate one-time codes to regain account
                                access.
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={generateRecoveryCodes}
                            >
                              Generate
                            </Button>
                          </div>

                          {recoveryCodes.length ? (
                            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-700 sm:grid-cols-2">
                              {recoveryCodes.map((code) => (
                                <div key={code}>{code}</div>
                              ))}
                            </div>
                          ) : null}

                          {lastVerifiedAt ? (
                            <div className="text-sm text-slate-500">
                              Last verified:{" "}
                              <span className="font-medium text-slate-900">
                                {lastVerifiedAt}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </SettingsCard>

                  <SettingsCard
                    title="Active sessions"
                    description="Review and sign out sessions across devices."
                    Icon={Smartphone}
                  >
                    <div className="space-y-3">
                      {sessions.map((s, idx) => (
                        <div key={s.id}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-slate-900">
                              {s.label}
                            </div>
                            <Button variant="outline" onClick={signOutSession}>
                              Sign out
                            </Button>
                          </div>
                          {idx < sessions.length - 1 ? (
                            <Separator className="mt-3" />
                          ) : null}
                        </div>
                      ))}
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={signOutAllSessions}
                        >
                          Sign out of all devices
                        </Button>
                      </div>
                    </div>
                  </SettingsCard>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={connectDialogOpen} onOpenChange={requestDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Telegram</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">
                1) Open Telegram and start our bot
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Search for the bot and send the code below.
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Code
                  </div>
                  <div className="mt-1 truncate font-mono text-base font-semibold text-slate-900">
                    {connectCode}
                  </div>
                </div>
                <Button variant="outline" onClick={copyConnectCode}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            {deepLink && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                  <Link className="h-4 w-4" />
                  Or click to open Telegram bot:
                </div>
                <a
                  href={deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block truncate text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {deepLink}
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={copyDeepLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">
                2) Confirm connection
              </div>
              <div className="mt-1 text-sm text-slate-600">
                After sending the code, confirm below to complete linking.
              </div>
            </div>

            {connectStep === "waiting" || connectStep === "loading" ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                {connectStep === "loading"
                  ? "Starting verification..."
                  : "Waiting for confirmation…"}
              </div>
            ) : null}

            {connectStep === "error" ? (
              <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                <CheckCircle2 className="h-4 w-4" />
                Failed to start verification. Please try again.
              </div>
            ) : null}

            {connectStep === "success" ? (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Telegram connected
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeConnectDialog}
              disabled={connectStep === "waiting"}
            >
              Cancel
            </Button>
            {connectStep === "success" ? (
              <Button
                className="bg-orange-500 text-white hover:bg-orange-600"
                onClick={closeConnectDialog}
              >
                Done
              </Button>
            ) : (
              <Button
                className="bg-orange-500 text-white hover:bg-orange-600"
                onClick={confirmSentCode}
                disabled={
                  connectStep === "waiting" || connectStep === "loading"
                }
              >
                {connectStep === "waiting" || connectStep === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {connectStep === "loading" ? "Starting..." : "Confirming…"}
                  </>
                ) : (
                  "I sent the code"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordDialogOpen}
        onOpenChange={requestPasswordDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-900">
                Current password
              </div>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  updatePasswordField("currentPassword", event.target.value)
                }
                autoComplete="current-password"
                placeholder="Enter current password"
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-900">
                New password
              </div>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  updatePasswordField("newPassword", event.target.value)
                }
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-900">
                Confirm new password
              </div>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  updatePasswordField("confirmPassword", event.target.value)
                }
                autoComplete="new-password"
                placeholder="Re-enter new password"
                disabled={isChangingPassword}
              />
            </div>

            {passwordError ? (
              <div className="text-sm font-medium text-red-600">
                {passwordError}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closePasswordDialog}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={submitPasswordChange}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
