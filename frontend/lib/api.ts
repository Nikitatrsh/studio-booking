const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const TOKEN_KEY = "studio_booking_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export type UserRole = "admin" | "instructor" | "member";

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface StudioClassInstructor {
  id: number;
  name: string;
}

export interface StudioClass {
  id: number;
  name: string;
  instructor_id: number;
  capacity: number;
  day_of_week: DayOfWeek;
  start_time: string;
  duration: number;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  booked_count?: number;
  waitlisted_count?: number;
  instructor?: StudioClassInstructor;
}

export type MembershipTier = "pay-per-class" | "monthly-unlimited" | "student";
export type MembershipStatus = "active" | "expired" | "cancelled";

export interface MembershipUser {
  id: number;
  name: string;
  email: string;
}

export interface Membership {
  id: number;
  user_id: number;
  tier: MembershipTier;
  status: MembershipStatus;
  start_date: string;
  end_date: string | null;
  credits_remaining: number | null;
  created_at: string;
  updated_at: string;
  user?: MembershipUser;
}

export type BookingStatus = "booked" | "waitlisted" | "cancelled" | "attended";

export interface Booking {
  id: number;
  user_id: number;
  studio_class_id: number;
  status: BookingStatus;
  booked_at: string;
  created_at: string;
  updated_at: string;
  studio_class?: StudioClass;
  user?: MembershipUser;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: "member" | "instructor";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface StudioClassPayload {
  name: string;
  instructor_id?: number;
  capacity: number;
  day_of_week: DayOfWeek;
  start_time: string;
  duration: number;
  is_recurring?: boolean;
}

export interface MembershipPayload {
  user_id: number;
  tier: MembershipTier;
  status?: MembershipStatus;
  start_date: string;
  end_date?: string | null;
  credits_remaining?: number | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Could not reach the server. Is the API running?", 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message ?? "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, data?.errors);
  }

  return data as T;
}

export const api = {
  register: (payload: RegisterPayload) =>
    request<AuthResponse>("/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: LoginPayload) =>
    request<AuthResponse>("/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request<void>("/logout", { method: "POST" }),
  me: () => request<User>("/me"),

  studioClasses: {
    list: () => request<StudioClass[]>("/studio-classes"),
    get: (id: number) => request<StudioClass>(`/studio-classes/${id}`),
    create: (payload: StudioClassPayload) =>
      request<StudioClass>("/studio-classes", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: Partial<StudioClassPayload>) =>
      request<StudioClass>(`/studio-classes/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: number) => request<void>(`/studio-classes/${id}`, { method: "DELETE" }),
  },

  bookings: {
    list: () => request<Booking[]>("/bookings"),
    create: (studioClassId: number) =>
      request<Booking>("/bookings", {
        method: "POST",
        body: JSON.stringify({ studio_class_id: studioClassId }),
      }),
    cancel: (id: number) => request<Booking>(`/bookings/${id}`, { method: "DELETE" }),
  },

  memberships: {
    list: () => request<Membership[]>("/memberships"),
    create: (payload: MembershipPayload) =>
      request<Membership>("/memberships", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: Partial<MembershipPayload>) =>
      request<Membership>(`/memberships/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: number) => request<void>(`/memberships/${id}`, { method: "DELETE" }),
  },
};
