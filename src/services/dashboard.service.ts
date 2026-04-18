/**
 * Dashboard API service.
 */
import { apiRequest } from "./api.config";

export interface Briefing {
  title: string;
  content: string;
  tags: string[];
}

export interface DashboardOverview {
  briefing: Briefing;
  stats: Array<{
    label: string;
    percentage: number;
    completedText: string;
    subStats: Array<{ label: string; value: number }>;
    colorClass: string;
  }>;
  stats_raw?: {
    pending_count: number;
    high_risk_count: number;
    today_processed: number;
    total_count: number;
    face_registered_count: number;
    face_completion_rate: number;
  };
}

export interface Alert {
  id: string;
  title: string;
  level: string;
  desc: string;
  time: string;
  type: "error" | "warning" | "info";
  risk_level: string;
  reason: string;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const res = await apiRequest("/dashboard/overview");
  if (!res.ok) throw new Error("Failed to fetch dashboard overview");
  return res.json();
}

export async function getDashboardAlerts(): Promise<{ alerts: Alert[]; total: number }> {
  const res = await apiRequest("/dashboard/alerts");
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function getTodayBriefing(): Promise<Briefing & { id: string | null; date: string }> {
  const res = await apiRequest("/briefing/today");
  if (!res.ok) throw new Error("Failed to fetch briefing");
  return res.json();
}

export async function generateBriefing(): Promise<{
  message: string;
  title: string;
  content: string;
  tags: string[];
  date: string;
}> {
  const res = await apiRequest("/briefing/generate", { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to generate briefing");
  }
  return res.json();
}
