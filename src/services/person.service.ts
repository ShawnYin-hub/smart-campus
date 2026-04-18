/**
 * Personnel records API service.
 */
import { apiRequest } from "./api.config";

export interface Person {
  id: string;
  student_id: string;
  name: string;
  dept: string | null;
  role_type: string;
  phone: string | null;
  face_registered: boolean;
  face_image_url: string | null;
  device_id: string | null;
  device_bind_time: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PersonStats {
  total: number;
  student_count: number;
  teacher_count: number;
  face_registered_count: number;
  face_pending_count: number;
  face_completion_rate: number;
  attendance_rate: number;
}

export interface PersonListResponse {
  items: Person[];
  total: number;
  page: number;
  page_size: number;
  pending_face_count: number;
}

/**
 * Get personnel statistics.
 */
export async function getPersonStats(): Promise<PersonStats> {
  const res = await apiRequest("/persons/stats");
  if (!res.ok) throw new Error("Failed to fetch person stats");
  return res.json();
}

/**
 * Paginated personnel list.
 */
export async function getPersonList(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  role_type?: string;
}): Promise<PersonListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  if (params?.role_type) query.set("role_type", params.role_type);

  const res = await apiRequest(`/persons?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch person list");
  return res.json();
}

/**
 * Get personnel detail.
 */
export async function getPerson(id: string): Promise<Person> {
  const res = await apiRequest(`/persons/${id}`);
  if (!res.ok) throw new Error("Failed to fetch person detail");
  return res.json();
}

/**
 * Create a new personnel record.
 */
export async function createPerson(data: {
  student_id: string;
  name: string;
  dept?: string;
  role_type?: string;
  phone?: string;
  id_card?: string;
}): Promise<Person> {
  const res = await apiRequest("/persons", {
    method: "POST",
    body: data,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to create person");
  }
  return res.json();
}

/**
 * Batch import personnel records.
 */
export async function batchImportPersons(
  persons: Array<{
    student_id: string;
    name: string;
    dept?: string;
    role_type?: string;
  }>,
): Promise<{ message: string; success_count: number; fail_count: number }> {
  const res = await apiRequest("/persons/batch", {
    method: "POST",
    body: { persons },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Batch import failed");
  }
  return res.json();
}

/**
 * Update a personnel record.
 */
export async function updatePerson(
  id: string,
  data: Partial<Person>,
): Promise<Person> {
  const res = await apiRequest(`/persons/${id}`, {
    method: "PUT",
    body: data,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to update person");
  }
  return res.json();
}

/**
 * Delete a personnel record.
 */
export async function deletePerson(id: string): Promise<void> {
  const res = await apiRequest(`/persons/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete person");
}
