import axios from "axios";
import type {
  UserProfileDto,
  AnalyticsSummaryDto,
  RecommendationsDto,
  NoteDto,
  UpsertNoteDto,
  SyncResultDto,
} from "@cp-dashboard/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Response interceptor for global error normalization ──────
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ?? err.message ?? "Unknown error";
    return Promise.reject(new Error(message));
  }
);

// ─── API Methods ──────────────────────────────────────────────
export const api = {
  // Sync user data from Codeforces
  syncUser: async (handle: string): Promise<SyncResultDto> => {
    const { data } = await client.post<SyncResultDto>(`/sync/${handle}`);
    return data;
  },

  // Get cached user profile
  getProfile: async (handle: string): Promise<UserProfileDto> => {
    const { data } = await client.get<UserProfileDto>(`/users/${handle}`);
    return data;
  },

  // Get analytics summary (tag weaknesses + rating history)
  getAnalytics: async (handle: string): Promise<AnalyticsSummaryDto> => {
    const { data } = await client.get<AnalyticsSummaryDto>(
      `/analytics/${handle}`
    );
    return data;
  },

  // Get smart recommendations
  getRecommendations: async (handle: string): Promise<RecommendationsDto> => {
    const { data } = await client.get<RecommendationsDto>(
      `/recommendations/${handle}`
    );
    return data;
  },

  // Get a problem's metadata
  getProblem: async (problemId: string) => {
    const { data } = await client.get(`/problems/${problemId}`);
    return data;
  },

  // Get note for a problem
  getNote: async (problemId: string, handle?: string): Promise<NoteDto | null> => {
    try {
      const params = handle ? { params: { handle } } : {};
      const { data } = await client.get<NoteDto>(`/notes/${problemId}`, params);
      return data;
    } catch {
      return null;
    }
  },

  // Upsert note (create or update)
  upsertNote: async (
    problemId: string,
    dto: UpsertNoteDto,
    handle?: string
  ): Promise<NoteDto> => {
    const params = handle ? { params: { handle } } : {};
    const { data } = await client.put<NoteDto>(`/notes/${problemId}`, dto, params);
    return data;
  },
};
