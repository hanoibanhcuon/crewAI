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
  masked_key?: string;
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

  if (strength <= 2) return { strength, label: "Yếu", color: "bg-red-500" };
  if (strength <= 3) return { strength, label: "Trung bình", color: "bg-yellow-500" };
  return { strength, label: "Mạnh", color: "bg-green-500" };
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

  // Helper to get masked key for display
  const getMaskedKey = (provider: string) => {
    const status = apiKeysStatus.find((k: ApiKeyStatus) => k.provider === provider);
    return status?.masked_key || "";
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
      toast.success("Cập nhật hồ sơ thành công!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể cập nhật hồ sơ");
    },
  });

  // Save API key mutation with optimistic update
  const saveApiKeyMutation = useMutation({
    mutationFn: async ({ provider, api_key }: { provider: string; api_key: string }) => {
      const response = await usersApi.setApiKey(provider, api_key);
      return response.data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["apiKeys"] });
      // Snapshot previous value
      const previousApiKeys = queryClient.getQueryData<ApiKeyStatus[]>(["apiKeys"]);
      // Optimistically update
      queryClient.setQueryData<ApiKeyStatus[]>(["apiKeys"], (old = []) => {
        const exists = old.find(k => k.provider === variables.provider);
        if (exists) {
          return old.map(k => k.provider === variables.provider ? { ...k, is_set: true } : k);
        }
        return [...old, { provider: variables.provider, is_set: true }];
      });
      return { previousApiKeys };
    },
    onSuccess: (_data, variables) => {
      toast.success(`Đã lưu khóa API ${variables.provider.charAt(0).toUpperCase() + variables.provider.slice(1)}!`);
      // Clear the specific input after success
      if (variables.provider === "openai") setOpenaiKey("");
      if (variables.provider === "anthropic") setAnthropicKey("");
      if (variables.provider === "serper") setSerperKey("");
      setSavingKey(null);
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousApiKeys) {
        queryClient.setQueryData(["apiKeys"], context.previousApiKeys);
      }
      toast.error(error.response?.data?.detail || "Không thể lưu khóa API");
      setSavingKey(null);
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
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
      toast.success(`Đã xóa khóa API ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể xóa khóa API");
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const response = await usersApi.changePassword(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể đổi mật khẩu");
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ full_name: fullName, email });
  };

  const handleSaveApiKey = (provider: string, key: string) => {
    if (!key.trim()) {
      toast.error("Vui lòng nhập khóa API");
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
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự");
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
      <DashboardLayout title="Cài đặt">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Cài đặt">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Hồ sơ
            </CardTitle>
            <CardDescription>Quản lý cài đặt tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Họ và tên</label>
              <Input
                placeholder="Nguyễn Văn A"
                className="mt-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="ten@example.com"
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
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Lưu thay đổi
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
              Khóa API
            </CardTitle>
            <CardDescription>Cấu hình khóa API của nhà cung cấp LLM</CardDescription>
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
                    <label className="text-sm font-medium">Khóa API OpenAI</label>
                    {isKeyConfigured("openai") && (
                      <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã cấu hình
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        type={showOpenai ? "text" : "password"}
                        placeholder={isKeyConfigured("openai") ? getMaskedKey("openai") || "Nhập khóa mới để thay thế" : "sk-..."}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowOpenai(!showOpenai)}
                        disabled={!openaiKey}
                        title={openaiKey ? (showOpenai ? "Ẩn" : "Hiện") : "Nhập khóa để hiện/ẩn"}
                      >
                        {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => handleSaveApiKey("openai", openaiKey)}
                      disabled={!openaiKey || savingKey === "openai"}
                      title="Lưu khóa OpenAI"
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
                        title="Xóa khóa OpenAI"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Anthropic Key */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Khóa API Anthropic</label>
                    {isKeyConfigured("anthropic") && (
                      <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã cấu hình
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        type={showAnthropic ? "text" : "password"}
                        placeholder={isKeyConfigured("anthropic") ? getMaskedKey("anthropic") || "Nhập khóa mới để thay thế" : "sk-ant-..."}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowAnthropic(!showAnthropic)}
                        disabled={!anthropicKey}
                        title={anthropicKey ? (showAnthropic ? "Ẩn" : "Hiện") : "Nhập khóa để hiện/ẩn"}
                      >
                        {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => handleSaveApiKey("anthropic", anthropicKey)}
                      disabled={!anthropicKey || savingKey === "anthropic"}
                      title="Lưu khóa Anthropic"
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
                        title="Xóa khóa Anthropic"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Serper Key */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Khóa API Serper</label>
                    {isKeyConfigured("serper") && (
                      <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã cấu hình
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        type={showSerper ? "text" : "password"}
                        placeholder={isKeyConfigured("serper") ? getMaskedKey("serper") || "Nhập khóa mới để thay thế" : "Nhập khóa API Serper"}
                        value={serperKey}
                        onChange={(e) => setSerperKey(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowSerper(!showSerper)}
                        disabled={!serperKey}
                        title={serperKey ? (showSerper ? "Ẩn" : "Hiện") : "Nhập khóa để hiện/ẩn"}
                      >
                        {showSerper ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => handleSaveApiKey("serper", serperKey)}
                      disabled={!serperKey || savingKey === "serper"}
                      title="Lưu khóa Serper"
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
                        title="Xóa khóa Serper"
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
              Thông báo
            </CardTitle>
            <CardDescription>Cấu hình tùy chọn thông báo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Thông báo qua email</p>
                <p className="text-sm text-muted-foreground">Nhận cập nhật qua email</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cảnh báo thực thi</p>
                <p className="text-sm text-muted-foreground">Nhận thông báo khi thất bại</p>
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
              Giao diện
            </CardTitle>
            <CardDescription>Tùy chỉnh giao diện hiển thị</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Chủ đề</p>
                <p className="text-sm text-muted-foreground">Sáng, Tối, hoặc Hệ thống</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  title="Chủ đề sáng"
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Sáng
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  title="Chủ đề tối"
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Tối
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  title="Theo hệ thống"
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  Hệ thống
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
              Bảo mật
            </CardTitle>
            <CardDescription>Quản lý cài đặt bảo mật</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mật khẩu hiện tại</label>
              <div className="relative mt-1">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại"
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
              <label className="text-sm font-medium">Mật khẩu mới</label>
              <div className="relative mt-1">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
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
              <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
              <div className="relative mt-1">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu mới"
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
                  Mật khẩu khớp
                </p>
              )}
              {passwordsMismatch && (
                <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>
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
                  Đang đổi...
                </>
              ) : (
                "Đổi mật khẩu"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Nhóm
            </CardTitle>
            <CardDescription>Quản lý thành viên nhóm của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Thành viên nhóm</p>
                <p className="text-sm text-muted-foreground">Mời và quản lý thành viên</p>
              </div>
              <Button asChild>
                <a href="/settings/teams">Quản lý nhóm</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
