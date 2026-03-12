import axios, { AxiosInstance } from 'axios';
import {
  WhoopApiConfig,
  WhoopUserProfile,
  WhoopBodyMeasurements,
  WhoopCycle,
  WhoopCycleCollection,
  WhoopRecovery,
  WhoopRecoveryCollection,
  WhoopSleep,
  WhoopSleepCollection,
  WhoopWorkout,
  WhoopWorkoutCollection,
  PaginationParams,
  OAuthTokenResponse,
  ITokenStorage,
} from './types.js';
import { buildPaginationUrl } from './utils/pagination.js';

export class WhoopApiClient {
  private client: AxiosInstance;
  private oauthClient: AxiosInstance;
  private config: WhoopApiConfig;
  private tokenStorage: ITokenStorage | null = null;
  private isRefreshing = false;

  constructor(config: WhoopApiConfig, tokenStorage?: ITokenStorage) {
    this.config = config;
    this.tokenStorage = tokenStorage ?? null;
    this.client = axios.create({
      baseURL: 'https://api.prod.whoop.com/developer/v2',
      headers: { 'Content-Type': 'application/json' },
    });

    this.oauthClient = axios.create({
      baseURL: 'https://api.prod.whoop.com/oauth/oauth2',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.client.interceptors.request.use((reqConfig) => {
      if (this.config.accessToken) {
        reqConfig.headers.Authorization = `Bearer ${this.config.accessToken}`;
      }
      return reqConfig;
    });

    // Auto-refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          this.config.refreshToken &&
          !this.isRefreshing
        ) {
          originalRequest._retry = true;
          this.isRefreshing = true;
          try {
            console.error('Auto-refreshing expired WHOOP token...');
            const result = await this.refreshToken(this.config.refreshToken);
            this.setAccessToken(result.access_token);
            this.config.refreshToken = result.refresh_token;
            if (this.tokenStorage) {
              await this.tokenStorage.save({
                accessToken: result.access_token,
                refreshToken: result.refresh_token,
                timestamp: new Date().toISOString(),
              });
              console.error('Auto-refresh successful, tokens saved.');
            }
            originalRequest.headers.Authorization = `Bearer ${result.access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            console.error('Auto-refresh failed:', refreshError instanceof Error ? refreshError.message : refreshError);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }
        return Promise.reject(error);
      },
    );
  }

  setAccessToken(accessToken: string): void {
    this.config.accessToken = accessToken;
  }

  hasToken(): boolean {
    return !!this.config.accessToken;
  }

  // User endpoints
  async getUserProfile(): Promise<WhoopUserProfile> {
    const response = await this.client.get('/user/profile/basic');
    return response.data;
  }

  async getUserBodyMeasurements(): Promise<WhoopBodyMeasurements> {
    const response = await this.client.get('/user/measurement/body');
    return response.data;
  }

  async revokeUserAccess(): Promise<void> {
    await this.client.delete('/user/access');
  }

  // Cycle endpoints
  async getCycleById(cycleId: number): Promise<WhoopCycle> {
    const response = await this.client.get(`/cycle/${cycleId}`);
    return response.data;
  }

  async getCycleCollection(params?: PaginationParams): Promise<WhoopCycleCollection> {
    const url = buildPaginationUrl('/cycle', params);
    const response = await this.client.get(url);
    return response.data;
  }

  async getSleepForCycle(cycleId: number): Promise<WhoopSleep[]> {
    const response = await this.client.get(`/cycle/${cycleId}/sleep`);
    return response.data;
  }

  // Recovery endpoints
  async getRecoveryCollection(params?: PaginationParams): Promise<WhoopRecoveryCollection> {
    const url = buildPaginationUrl('/recovery', params);
    const response = await this.client.get(url);
    return response.data;
  }

  async getRecoveryForCycle(cycleId: number): Promise<WhoopRecovery[]> {
    const response = await this.client.get(`/cycle/${cycleId}/recovery`);
    return response.data;
  }

  // Sleep endpoints
  async getSleepById(sleepId: string): Promise<WhoopSleep> {
    const response = await this.client.get(`/activity/sleep/${sleepId}`);
    return response.data;
  }

  async getSleepCollection(params?: PaginationParams): Promise<WhoopSleepCollection> {
    const url = buildPaginationUrl('/activity/sleep', params);
    const response = await this.client.get(url);
    return response.data;
  }

  // Workout endpoints
  async getWorkoutById(workoutId: string): Promise<WhoopWorkout> {
    const response = await this.client.get(`/activity/workout/${workoutId}`);
    return response.data;
  }

  async getWorkoutCollection(params?: PaginationParams): Promise<WhoopWorkoutCollection> {
    const url = buildPaginationUrl('/activity/workout', params);
    const response = await this.client.get(url);
    return response.data;
  }

  // OAuth endpoints
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'offline read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement',
    });
    if (state) params.append('state', state);
    return `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    const formData = new URLSearchParams();
    formData.append('client_id', this.config.clientId);
    formData.append('client_secret', this.config.clientSecret);
    formData.append('code', code);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', this.config.redirectUri);

    const response = await this.oauthClient.post('/token', formData);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const formData = new URLSearchParams();
    formData.append('client_id', this.config.clientId);
    formData.append('client_secret', this.config.clientSecret);
    formData.append('refresh_token', refreshToken);
    formData.append('grant_type', 'refresh_token');

    const response = await this.oauthClient.post('/token', formData);
    return response.data;
  }
}
