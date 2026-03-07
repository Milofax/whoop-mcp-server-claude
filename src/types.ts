// WHOOP API Response Types
export interface WhoopUserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WhoopBodyMeasurements {
  height_meter: number;
  weight_kilogram: number;
  max_heart_rate: number;
}

export interface WhoopCycleScore {
  strain: number;
  kilojoule: number;
  average_heart_rate: number;
  max_heart_rate: number;
}

export interface WhoopCycle {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score_state: string;
  score: WhoopCycleScore;
}

export interface WhoopCycleCollection {
  records: WhoopCycle[];
  next_token?: string;
}

export interface WhoopRecoveryScore {
  score_state: string;
  score?: {
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
  };
}

export interface WhoopRecovery {
  id: string;
  v1_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score_state: string;
  score?: WhoopRecoveryScore['score'];
}

export interface WhoopRecoveryCollection {
  records: WhoopRecovery[];
  next_token?: string;
}

export interface WhoopSleepStageSummary {
  total_in_bed_time_milli: number;
  total_awake_time_milli: number;
  total_no_data_time_milli: number;
  total_light_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_rem_sleep_time_milli: number;
  sleep_cycle_count: number;
  disturbance_count: number;
}

export interface WhoopSleepNeeded {
  baseline_milli: number;
  need_from_sleep_debt_milli: number;
  need_from_recent_strain_milli: number;
  need_from_recent_nap_milli: number;
}

export interface WhoopSleepScore {
  stage_summary: WhoopSleepStageSummary;
  sleep_needed: WhoopSleepNeeded;
  respiratory_rate: number;
  sleep_performance_percentage: number;
  sleep_consistency_percentage: number;
  sleep_efficiency_percentage: number;
}

export interface WhoopSleep {
  id: string;
  v1_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score?: WhoopSleepScore;
}

export interface WhoopSleepCollection {
  records: WhoopSleep[];
  next_token?: string;
}

export interface WhoopWorkoutZoneDurations {
  zone_zero_milli: number;
  zone_one_milli: number;
  zone_two_milli: number;
  zone_three_milli: number;
  zone_four_milli: number;
  zone_five_milli: number;
}

export interface WhoopWorkoutScore {
  strain: number;
  average_heart_rate: number;
  max_heart_rate: number;
  kilojoule: number;
  percent_recorded: number;
  distance_meter?: number;
  altitude_gain_meter?: number;
  altitude_change_meter?: number;
  zone_durations?: WhoopWorkoutZoneDurations;
}

export interface WhoopWorkout {
  id: string;
  v1_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_name: string;
  sport_id: number;
  score_state: string;
  score?: WhoopWorkoutScore;
}

export interface WhoopWorkoutCollection {
  records: WhoopWorkout[];
  next_token?: string;
}

// OAuth token response from WHOOP API
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// Stored token data for file persistence
export interface StoredTokenData {
  accessToken: string;
  refreshToken: string;
  timestamp: string;
}

// MCP Server Types
export interface WhoopApiConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

export interface PaginationParams {
  limit?: number;
  start?: string;
  end?: string;
  nextToken?: string;
}

// SEAM: Auth provider interface — new auth methods plug in here
export interface IAuthProvider {
  getAuthorizationUrl(state?: string): string;
  exchangeCodeForToken(code: string): Promise<OAuthTokenResponse>;
  refreshToken(refreshToken: string): Promise<OAuthTokenResponse>;
}

// SEAM: Token storage interface — swap file for keychain/1Password later
export interface ITokenStorage {
  load(): Promise<StoredTokenData | null>;
  save(data: StoredTokenData): Promise<void>;
}

/**
 * All 16 WHOOP tool names as a const array.
 *
 * ID type inconsistency note (per WHOOP API):
 * - cycleId is a number
 * - sleepId and workoutId are strings
 * This is intentional and matches the WHOOP API contract.
 */
export const WHOOP_TOOL_NAMES = [
  'whoop-get-user-profile',
  'whoop-get-user-body-measurements',
  'whoop-revoke-user-access',
  'whoop-get-cycle-by-id',
  'whoop-get-cycle-collection',
  'whoop-get-sleep-for-cycle',
  'whoop-get-recovery-collection',
  'whoop-get-recovery-for-cycle',
  'whoop-get-sleep-by-id',
  'whoop-get-sleep-collection',
  'whoop-get-workout-by-id',
  'whoop-get-workout-collection',
  'whoop-get-authorization-url',
  'whoop-exchange-code-for-token',
  'whoop-refresh-token',
  'whoop-set-access-token',
] as const;

export type WhoopToolName = typeof WHOOP_TOOL_NAMES[number];

// Auth-bypass tools that don't require a valid access token
export const AUTH_BYPASS_TOOLS: ReadonlySet<WhoopToolName> = new Set([
  'whoop-set-access-token',
  'whoop-get-authorization-url',
  'whoop-exchange-code-for-token',
  'whoop-refresh-token',
]);
