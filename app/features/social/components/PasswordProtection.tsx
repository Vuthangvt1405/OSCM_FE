"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface PasswordProtectionProps {
  onPasswordChange: (password: string | null) => void;
}

export function PasswordProtection({
  onPasswordChange,
}: PasswordProtectionProps) {
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");

  const handlePasswordToggle = () => {
    if (!isPasswordEnabled) {
      // Show confirmation dialog first
      setShowPasswordInput(true);
    } else {
      // Disable password protection
      setIsPasswordEnabled(false);
      setShowPasswordInput(false);
      setPassword("");
      onPasswordChange(null);
    }
  };

  const handleConfirmEnable = () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsPasswordEnabled(true);
    setShowPasswordInput(false);
    onPasswordChange(password);
    toast.success("Password protection enabled");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center justify-between">
        <span>Password Protection</span>
        <Switch
          checked={isPasswordEnabled}
          onCheckedChange={handlePasswordToggle}
        />
      </Label>

      {showPasswordInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Enable Password Protection
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This will require a password to view your post. Please enter a
              password (min 6 characters).
            </p>
            <div className="mt-4 space-y-2">
              <Label>
                Password
                <Input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter password"
                  className="mt-1"
                />
              </Label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPasswordInput(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnable}
                disabled={password.length < 6}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasswordEnabled && (
        <div className="space-y-2">
          <Label>
            Password
            <Input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter password"
              className="mt-1"
            />
          </Label>
          <p className="text-sm text-slate-500">
            Minimum 6 characters. This password will be required to view your
            post.
          </p>
        </div>
      )}
    </div>
  );
}
