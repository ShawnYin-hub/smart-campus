/**
 * Approval management API service.
 */
import { apiRequest } from "./api.config";

export interface PersonBrief {
  id: string;
  name: string;
  student_id: string;
}

export interface Approval {
  id: string;
  person_id: string;
  person: PersonBrief | null;
  type: string;
  start_time: string | null;
  end_time: string | null;
  reason: string;
  risk_level: "high" | "low";
  risk_reason: string | null;
  alert: boolean;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ApprovalStats {
  pending_count: number;
  today_processed: number;
  yesterday_count: number;
  compliance_rate: number;
}

export interface ApprovalListResponse {
  items: Approval[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Get approval statistics.
 */
export async function getApprovalStats(): Promise<ApprovalStats> {
  const res = await apiRequest("/approvals/stats");
  if (!res.ok) throw new Error("Failed to fetch approval stats");
  return res.json();
}

/**
 * Paginated approval list.
 */
export async function getApprovalList(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  risk_level?: string;
  search?: string;
}): Promise<ApprovalListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.status) query.set("status", params.status);
  if (params?.risk_level) query.set("risk_level", params.risk_level);
  if (params?.search) query.set("search", params.search);

  const res = await apiRequest(`/approvals?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch approval list");
  return res.json();
}

/**
 * Get approval detail.
 */
export async function getApproval(id: string): Promise<Approval> {
  const res = await apiRequest(`/approvals/${id}`);
  if (!res.ok) throw new Error("Failed to fetch approval detail");
  return res.json();
}

/**
 * Create a new approval request (AI risk labeling included on backend).
 */
export async function createApproval(data: {
  person_id: string;
  type: string;
  start_time?: string;
  end_time?: string;
  reason: string;
}): Promise<Approval> {
  const res = await apiRequest("/approvals", {
    method: "POST",
    body: data,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to create approval");
  }
  return res.json();
}

/**
 * Approve an approval request.
 */
export async function approveApproval(
  id: string,
  comment?: string,
): Promise<Approval> {
  const res = await apiRequest(`/approvals/${id}/approve`, {
    method: "POST",
    body: { comment },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to approve");
  }
  return res.json();
}

/**
 * Reject an approval request.
 */
export async function rejectApproval(
  id: string,
  comment?: string,
): Promise<Approval> {
  const res = await apiRequest(`/approvals/${id}/reject`, {
    method: "POST",
    body: { comment },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to reject");
  }
  return res.json();
}
