/**
 * 认证 API 服务
 * 处理登录、获取当前用户信息。
 */
import { API_BASE_URL } from "./api.config";

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    full_name: string | null;
    email: string;
    role: string;
  };
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

/**
 * 登录（OAuth2 Password Flow）
 * 使用 form-data 格式，符合 FastAPI OAuth2PasswordRequestForm
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "登录失败" }));
    throw new Error(error.detail || "登录失败");
  }

  const data = await response.json();

  // 将 Token 存入 localStorage
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_info", JSON.stringify(data.user));

  return data;
}

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUser(): Promise<UserInfo> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("未登录");

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error("登录已过期，请重新登录");
    }
    throw new Error("获取用户信息失败");
  }

  return response.json();
}

/**
 * 退出登录（清除本地 Token）
 */
export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_info");
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("access_token");
}

/**
 * 获取本地存储的用户信息
 */
export function getLocalUser() {
  const info = localStorage.getItem("user_info");
  return info ? JSON.parse(info) : null;
}

/**
 * 获取 Authorization 请求头
 */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 修改当前用户密码
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("未登录");

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "修改密码失败" }));
    throw new Error((error as { detail?: string }).detail || "修改密码失败");
  }

  return response.json();
}
