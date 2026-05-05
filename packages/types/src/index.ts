// ============================================================
// Shared TypeScript Interfaces — CP Dashboard
// ============================================================

// ─── Codeforces API Raw Types ───────────────────────────────

export interface CfUserInfo {
  handle: string;
  email?: string;
  vkId?: string;
  openId?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  rating: number;
  maxRank: string;
  maxRating: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

export interface CfSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CfProblem;
  author: CfParty;
  programmingLanguage: string;
  verdict?: CfVerdict;
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

export interface CfProblem {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: string;
  points?: number;
  rating?: number;
  tags: string[];
}

export interface CfParty {
  contestId?: number;
  members: CfMember[];
  participantType: string;
  teamId?: number;
  teamName?: string;
  ghost: boolean;
  room?: number;
  startTimeSeconds?: number;
}

export interface CfMember {
  handle: string;
  name?: string;
}

export interface CfRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export type CfVerdict =
  | 'FAILED'
  | 'OK'
  | 'PARTIAL'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'WRONG_ANSWER'
  | 'PRESENTATION_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'IDLENESS_LIMIT_EXCEEDED'
  | 'SECURITY_VIOLATED'
  | 'CRASHED'
  | 'INPUT_PREPARATION_CRASHED'
  | 'CHALLENGED'
  | 'SKIPPED'
  | 'TESTING'
  | 'REJECTED';

// ─── API Response DTOs ──────────────────────────────────────

export interface ApiResponse<T> {
  status: 'OK' | 'FAILED';
  result: T;
  comment?: string;
}

export interface UserProfileDto {
  id: string;
  cfHandle: string;
  currentRating: number | null;
  maxRating: number | null;
  rank: string | null;
  avatar: string | null;
  country: string | null;
  lastSynced: string | null;
}

export interface SyncResultDto {
  handle: string;
  submissionsCount: number;
  problemsCount: number;
  syncedAt: string;
}

// ─── Analytics Types ─────────────────────────────────────────

export interface TagWeaknessScore {
  tag: string;
  accepted: number;
  wrongAnswer: number;
  total: number;
  weaknessScore: number; // 0-1, higher = weaker
}

export interface RatingDataPoint {
  date: string; // ISO string
  rating: number;
  contestName: string;
  rank: number;
  delta: number;
}

export interface AnalyticsSummaryDto {
  handle: string;
  totalSubmissions: number;
  solvedProblems: number;
  acceptedRate: number;
  tagWeaknesses: TagWeaknessScore[];
  ratingHistory: RatingDataPoint[];
  currentRating: number | null;
}

// ─── Recommendation Types ────────────────────────────────────

export interface RecommendedProblem {
  id: string;         // e.g. "1900A"
  contestId: number;
  index: string;
  name: string;
  rating: number;
  tags: string[];
  url: string;
  weaknessTags: string[];  // tags that overlap with user weaknesses
  priorityScore: number;   // higher = more recommended
}

export interface RecommendationsDto {
  handle: string;
  currentRating: number;
  targetRatingMin: number;
  targetRatingMax: number;
  problems: RecommendedProblem[];
}

// ─── Note / Editorial Types ──────────────────────────────────

export interface NoteDto {
  id: string;
  userId: string;
  problemId: string;
  content: string;
  code: string | null;
  language: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertNoteDto {
  content: string;
  code?: string;
  language?: string;
}

export interface MarkdownExportData {
  problem: {
    id: string;
    name: string;
    rating: number | null;
    tags: string[];
    url: string;
  };
  note: NoteDto;
  exportedAt: string;
}

// ─── Supported Code Languages ─────────────────────────────────
export type CodeLanguage = 'cpp' | 'python' | 'typescript';
