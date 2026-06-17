"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "~/stores/auth";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  User,
  Sun,
  Moon,
  Bell,
  Keyboard,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Eye,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { toast } from "sonner";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"account" | "appearance" | "notifications" | "keybinds">("account");
  const [mounted, setMounted] = useState(false);

  // Light mode alert dialog state
  const [lightModeWarningOpen, setLightModeWarningOpen] = useState(false);

  // Notifications toggles
  const [emailSubmissions, setEmailSubmissions] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tabs = [
    { id: "account", label: "My Account", icon: User },
    { id: "appearance", label: "Appearance", icon: Moon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "keybinds", label: "Keyboard Shortcuts", icon: Keyboard },
  ] as const;

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    if (newTheme === "light") {
      setLightModeWarningOpen(true);
    } else {
      setTheme(newTheme);
      toast.success(`Theme changed to ${newTheme}`);
    }
  };

  const confirmLightMode = () => {
    setTheme("light");
    setLightModeWarningOpen(false);
    toast.warning("Light mode enabled. Keep some sunglasses nearby! 😎");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences updated successfully");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#080808] p-6 text-[#F2F2F2]">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-xs text-zinc-500">Configure your user account, app appearance, and interface preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Settings Sidebar */}
          <div className="flex flex-col gap-1 md:col-span-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold tracking-wide transition-all text-left cursor-pointer",
                    active
                      ? "bg-white/5 text-white ring-1 ring-white/10"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02]"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Settings Content */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 md:col-span-3">
            {/* 1. MY ACCOUNT TAB */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="size-14 ring-2 ring-[#E8854A]/30">
                    <AvatarFallback className="bg-linear-to-tr from-zinc-800 to-zinc-700 text-base font-bold text-zinc-100">
                      {user?.fullName ? getInitials(user.fullName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-bold text-white leading-none">
                      {authLoading ? "Loading..." : user?.fullName || "Guest User"}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1.5 leading-none">
                      {user?.email || "No email bound"}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-4">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Profile Information</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-3.5">
                      <span className="text-[10px] font-mono text-zinc-600 uppercase">Full Name</span>
                      <p className="text-xs font-medium text-zinc-300 mt-1">{user?.fullName || "—"}</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-3.5">
                      <span className="text-[10px] font-mono text-zinc-600 uppercase">Email Address</span>
                      <p className="text-xs font-medium text-zinc-300 mt-1">{user?.email || "—"}</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-3.5">
                      <span className="text-[10px] font-mono text-zinc-600 uppercase">Account Created</span>
                      <p className="text-xs font-medium text-zinc-300 mt-1">
                        {user ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-3.5">
                      <span className="text-[10px] font-mono text-zinc-600 uppercase">Workspace Status</span>
                      <p className="text-xs font-medium text-emerald-400 mt-1">Active (1 Workspace)</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex justify-end">
                  <Button variant="outline" disabled className="text-xs border-white/5 text-zinc-400">
                    Edit Profile Details
                  </Button>
                </div>
              </div>
            )}

            {/* 2. APPEARANCE TAB */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">App Theme</h3>
                  <p className="text-xs text-zinc-500 mt-1">Select your preferred display theme for the forms workspace.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-xl border p-4.5 bg-zinc-950/40 cursor-pointer transition-all hover:bg-zinc-950/80",
                      theme === "dark" ? "border-[#E8854A] ring-1 ring-[#E8854A]/20" : "border-white/5 text-zinc-500"
                    )}
                  >
                    <Moon className={cn("size-6", theme === "dark" && "text-[#E8854A]")} />
                    <span className="text-xs font-semibold text-zinc-300">Dark Mode</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange("light")}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-xl border p-4.5 bg-zinc-950/40 cursor-pointer transition-all hover:bg-zinc-950/80",
                      theme === "light" ? "border-[#E8854A] ring-1 ring-[#E8854A]/20" : "border-white/5 text-zinc-500"
                    )}
                  >
                    <Sun className={cn("size-6", theme === "light" && "text-[#E8854A]")} />
                    <span className="text-xs font-semibold text-zinc-300">Light Mode</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange("system")}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-xl border p-4.5 bg-zinc-950/40 cursor-pointer transition-all hover:bg-zinc-950/80",
                      theme === "system" ? "border-[#E8854A] ring-1 ring-[#E8854A]/20" : "border-white/5 text-zinc-500"
                    )}
                  >
                    <div className="flex gap-0.5">
                      <Sun className="size-5 text-zinc-500" />
                      <Moon className="size-5 text-zinc-500" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">System Default</span>
                  </button>
                </div>

                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 flex gap-3">
                  <Info className="size-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-amber-400">OLED Dark Aesthetics</p>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      My Form is designed natively with high-end dark backgrounds to minimize eye fatigue during form customization.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">Email Notification Settings</h3>
                  <p className="text-xs text-zinc-500 mt-1">Configure when you would like to receive update emails.</p>
                </div>

                <div className="space-y-4">
                  {/* Toggle 1 */}
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950/30 p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-zinc-200">Form Submission Alerts</p>
                      <p className="text-[11px] text-zinc-500">Get notified immediately via email whenever a respondent submits a form.</p>
                    </div>
                    <button
                      onClick={() => setEmailSubmissions(!emailSubmissions)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        emailSubmissions ? "bg-[#E8854A]" : "bg-zinc-800"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-4 transform rounded-full bg-black shadow-sm ring-0 transition duration-200 ease-in-out",
                          emailSubmissions ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {/* Toggle 2 */}
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950/30 p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-zinc-200">Weekly Response Digest</p>
                      <p className="text-[11px] text-zinc-500">Receive a weekly analytical report detailing all response activities.</p>
                    </div>
                    <button
                      onClick={() => setWeeklyDigest(!weeklyDigest)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        weeklyDigest ? "bg-[#E8854A]" : "bg-zinc-800"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-4 transform rounded-full bg-black shadow-sm ring-0 transition duration-200 ease-in-out",
                          weeklyDigest ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {/* Toggle 3 */}
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950/30 p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-zinc-200">Product Updates &amp; Tips</p>
                      <p className="text-[11px] text-zinc-500">Stay up to date with new features, templates, and tutorial articles.</p>
                    </div>
                    <button
                      onClick={() => setProductUpdates(!productUpdates)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        productUpdates ? "bg-[#E8854A]" : "bg-zinc-800"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-4 transform rounded-full bg-black shadow-sm ring-0 transition duration-200 ease-in-out",
                          productUpdates ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} className="bg-[#E8854A] text-[#0a0a0a] hover:bg-[#E8854A]/90 text-xs font-semibold rounded-xl cursor-pointer">
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* 4. KEYBINDS TAB */}
            {activeTab === "keybinds" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">Form Editor Shortcuts</h3>
                  <p className="text-xs text-zinc-500 mt-1">Accelerate your workflow with quick keyboard shortcuts inside the editor.</p>
                </div>

                <div className="rounded-xl border border-white/5 bg-zinc-950/60 divide-y divide-white/5 overflow-hidden">
                  <div className="flex items-center justify-between p-4.5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-200">Save Draft</p>
                      <p className="text-[10px] text-zinc-500">Save changes to current workspace draft.</p>
                    </div>
                    <div className="flex gap-1">
                      <kbd className="rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold px-1.5 py-0.5 text-zinc-300">Ctrl</kbd>
                      <span className="text-zinc-600 font-mono text-[10px] self-center">+</span>
                      <kbd className="rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold px-1.5 py-0.5 text-zinc-300">S</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4.5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-200">Preview Form Link</p>
                      <p className="text-[10px] text-zinc-500">Open the public runner preview in a new tab.</p>
                    </div>
                    <div className="flex gap-1">
                      <kbd className="rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold px-1.5 py-0.5 text-zinc-300">Ctrl</kbd>
                      <span className="text-zinc-600 font-mono text-[10px] self-center">+</span>
                      <kbd className="rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold px-1.5 py-0.5 text-zinc-300">P</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4.5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-200">Delete Field</p>
                      <p className="text-[10px] text-zinc-500">Delete the currently selected question block.</p>
                    </div>
                    <div className="flex gap-1">
                      <kbd className="rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold px-1.5 py-0.5 text-zinc-300">Delete</kbd>
                      <span className="text-zinc-600 font-mono text-[10px] self-center">/</span>
                      <kbd className="rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold px-1.5 py-0.5 text-zinc-300">Backspace</kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Light Mode Warning Dialog */}
      <Dialog open={lightModeWarningOpen} onOpenChange={setLightModeWarningOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden gap-0">
          <div className="relative p-6 pt-7 pb-5 border-b border-zinc-800 flex gap-4">
            <div className="size-11 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="size-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white tracking-tight">Warning: Eye Hazard!</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                You are about to enable Light Mode. Studies show that sudden exposure to highly bright, default white screens can cause intense glare and mild temporary discomfort.
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="p-4 bg-zinc-900/30 gap-2 border-t border-zinc-800">
            <Button
              variant="outline"
              onClick={() => setLightModeWarningOpen(false)}
              className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-xs rounded-xl"
            >
              Cancel (Go Back to Comfort)
            </Button>
            <Button
              onClick={confirmLightMode}
              className="bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-xl"
            >
              Enable Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
