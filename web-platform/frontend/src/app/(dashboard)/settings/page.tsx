"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Key,
  Bell,
  Palette,
  Shield,
  Users,
  Loader2,
  Check,
  Eye,
  EyeOff,
  CheckCircle,
  Trash2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";

interface ApiKeyStatus {
  provider: string;
  is_set: boolean;
  last_updated?: string;
}

// Password strength calculator
const getPasswordStrength = (password: string) => {
  if (!password) return { strength: 0, label: "", color: "" };
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return { strength, label: "Weak", color: "bg-red-500" };
  if (strength <= 3) return { strength, label: "Medium", color: "bg-yellow-500" };
  return { strength, label: "Strong", color: "bg-green-500" };
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [serperKey, setSerperKey] = useState("");
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showSerper, setShowSerper] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification preferences (local state for demo)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [executionAlerts, setExecutionAlerts] = useState(true);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await usersApi.getProfile();
      return response.data;
    },
  });

  // Fetch API keys status
  const { data: apiKeysStatus = [], isLoading: apiKeysLoading } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const response = await usersApi.getApiKeys();
      return response.data as ApiKeyStatus[];
    },
  });

  // Helper to check if a key is configured
  const isKeyConfigured = (provider: string) => {
    const status = apiKeysStatus.find((k: ApiKeyStatus) => k.provider === provider);
    return status?.is_set || false;
  };

  // Update profile form when data loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { full_name?: string; email?: string }) => {
      const response = await usersApi.updateProfile(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    },
  });

  // Save API key mutation
  const saveApiKeyMutation = useMutation({
    mutationFn: async ({ provider, api_key }: { provider: string; api_key: string }) => {
      const response = await usersApi.setApiKey(provider, api_key);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast.success(`${variables.provider.charAt(0).toUpperCase() + variables.provider.slice(1)} API key saved!`);
      // Clear the specific input
      if (variables.provider === "openai") setOpenaiKey("");
      if (variables.provider === "anthropic") setAnthropicKey("");
      if (variables.provider === "serper") setSerperKey("");
      setSavingKey(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save API key");
      setSavingKey(null);
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await usersApi.deleteApiKey(provider);
      return response.data;
    },
    onSuccess: (_data, provider) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key deleted!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete API key");
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const response = await usersApi.changePassword(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to change password");
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ full_name: fullName, email });
  };

  const handleSaveApiKey = (provider: string, key: string) => {
    if (!key.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    setSavingKey(provider);
    saveApiKeyMutation.mutate({ provider, api_key: key });
  };

  const handleDeleteApiKey = (provider: string) => {
    deleteApiKeyMutation.mutate(provider);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = !!(newPassword && confirmPassword && newPassword === confirmPassword);
  const passwordsMismatch = !!(newPassword && confirmPassword && newPassword !== confirmPassword);

  if (profileLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="John Doe"
                className="mt-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>Configure your LLM provider API keys</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiKeysLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* OpenAI Key */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">OpenAI API Key</label>
                    {isKeyConfigured("openai") && (
                      <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        type={showOpenai ? "text" : "password"}
                        placeholder={isKeyConfigured("openai") ? "Enter new key to replace" : "sk-..."}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowOpenai(!showOpenai)}
                        disabled={!openaiKey}
                        title={openaiKey ? (showOpenai ? "Hide" : "Show") : "Type a key to show/hide"}
                      >
                        {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => handleSaveApiKey("openai", openaiKey)}
                      disabled={!openaiKey || savingKey === "openai"}
                      title="Save OpenAI key"
                    >
                      {savingKey === "openai" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    {isKeyConfigured("openai") && (
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteApiKey("openai")}
                        disabled={deleteApiKeyMutation.isPending}
                        title="Delete OpenAI key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Anthropic Key */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Anthropic API Key</label>
                    {isKeyConfigured("anthropic") && (
                      <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        type={showAnthropic ? "text" : "password"}
                        placeholder={isKeyConfigured("anthropic") ? "Enter new key to replace" : "sk-ant-..."}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowAnthropic(!showAnthropic)}
                        disabled={!anthropicKey}
                        title={anthropicKey ? (showAnthropic ? "Hide" : "Show") : "Type a key to show/hide"}
                      >
                        {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => handleSaveApiKey("anthropic", anthropicKey)}
                      disabled={!anthropicKey || savingKey === "anthropic"}
                      title="Save Anthropic key"
                    >
                      {savingKey === "anthropic" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    {isKeyConfigured("anthropic") && (
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteApiKey("anthropic")}
                        disabled={deleteApiKeyMutation.isPending}
                        title="Delete Anthropic key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Serper Key */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Serper API Key</label>
                    {isKeyConfigured("serper") && (
                      <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        type={showSerper ? "text" : "password"}
                        placeholder={isKeyConfigured("serper") ? "Enter new key to replace" : "Enter Serper API key"}
                        value={serperKey}
                        onChange={(e) => setSerperKey(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowSerper(!showSerper)}
                        disabled={!serperKey}
                        title={serperKey ? (showSerper ? "Hide" : "Show") : "Type a key to show/hide"}
                      >
                        {showSerper ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => handleSaveApiKey("serper", serperKey)}
                      disabled={!serperKey || savingKey === "serper"}
                      title="Save Serper key"
                    >
                      {savingKey === "serper" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    {isKeyConfigured("serper") && (
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteApiKey("serper")}
                        disabled={deleteApiKeyMutation.isPending}
                        title="Delete Serper key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email updates</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Execution Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified on failures</p>
              </div>
              <Switch
                checked={executionAlerts}
                onCheckedChange={setExecutionAlerts}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Light, Dark, or System</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  title="Light theme"
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  title="Dark theme"
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  title="System theme"
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Password</label>
              <div className="relative mt-1">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <div className="relative mt-1">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          level <= passwordStrength.strength
                            ? passwordStrength.color
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.strength <= 2 ? "text-red-500" :
                    passwordStrength.strength <= 3 ? "text-yellow-500" : "text-green-500"
                  }`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Confirm New Password</label>
              <div className="relative mt-1">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pr-10 ${passwordsMismatch ? "border-red-500 focus-visible:ring-red-500" : ""} ${passwordsMatch ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordsMatch && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Passwords match
                </p>
              )}
              {passwordsMismatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || passwordsMismatch}
              variant="outline"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team
            </CardTitle>
            <CardDescription>Manage your team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Team Members</p>
                <p className="text-sm text-muted-foreground">Invite and manage members</p>
              </div>
              <Button asChild>
                <a href="/settings/teams">Manage Team</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
