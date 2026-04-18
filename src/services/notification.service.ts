/**
 * Notification management API service.
 */
import { apiRequest } from "./api.config";

export interface NotificationItem {
  id: string;
  notification_type: string;
  level: "info" | "warning" | "error";
  title: string;
  message: string | null;
  is_read: boolean;
  is_pinned: boolean;
  related_resource_type: string | null;
  related_resource_id: string | null;
  extra_data: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  page_size: number;
  unread_count: number;
}

/** Get notification list with pagination and filters. */
export async function getNotificationList(params?: {
  page?: number;
  page_size?: number;
  is_read?: boolean;
  notification_type?: string;
}): Promise<NotificationListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.is_read !== undefined) query.set("is_read", String(params.is_read));
  if (params?.notification_type) query.set("notification_type", params.notification_type);

  const res = await apiRequest(`/notifications?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

/** Get unread notification count. */
export async function getUnreadCount(): Promise<number> {
  const res = await apiRequest("/notifications/unread-count");
  if (!res.ok) throw new Error("Failed to fetch unread count");
  const data = await res.json();
  return data.unread_count as number;
}

/** Mark a single notification as read. */
export async function markNotificationRead(id: string): Promise<void> {
  const res = await apiRequest(`/notifications/${id}/read`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark as read");
}

/** Mark all notifications as read. */
export async function markAllNotificationsRead(): Promise<{ marked_count: number }> {
  const res = await apiRequest("/notifications/read-all", { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark all as read");
  return res.json();
}

/** Delete a single notification. */
export async function deleteNotification(id: string): Promise<void> {
  const res = await apiRequest(`/notifications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete notification");
}

/** Delete all read notifications. */
export async function deleteAllReadNotifications(): Promise<void> {
  const res = await apiRequest("/notifications/delete-all-read", { method: "POST" });
  if (!res.ok) throw new Error("Failed to clear read notifications");
}

/** Get high-risk alert notifications. */
export async function getNotificationAlerts(): Promise<{
  items: NotificationItem[];
  total: number;
}> {
  const res = await apiRequest("/notifications/alerts");
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

/** Notification type labels (Chinese). */
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  approval_request: "审批申请",
  approval_approved: "审批通过",
  approval_rejected: "审批拒绝",
  alert_high_risk: "高风险告警",
  system: "系统通知",
};

/** Notification level icon color classes. */
export const NOTIFICATION_LEVEL_COLORS: Record<string, string> = {
  info: "text-blue-500 bg-blue-50",
  warning: "text-amber-500 bg-amber-50",
  error: "text-red-500 bg-red-50",
};
