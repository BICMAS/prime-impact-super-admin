import { getAccessToken } from "@/utils/auth";
import { getApiV1BaseUrl } from "@/lib/apiConfig";

const BASE_URL = getApiV1BaseUrl();

export type EconomyRules = {
  courseCompletion: number;
  moduleCompletion: number;
  perfectQuiz: number;
  dailyStreak: number;
  streakDaysRequired?: number;
  enableLeaderboard: boolean;
  updatedAt?: string;
};

export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  coins: number;
};

export type EconomyResponse = {
  rules: EconomyRules;
  totalCirculating: number;
  leaderboard: LeaderboardEntry[];
};

function authHeaders() {
  const token = getAccessToken();
  if (!token) throw new Error("Missing access token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getEconomyRules(): Promise<EconomyResponse> {
  const res = await fetch(`${BASE_URL}/economy/rules`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to load economy rules");
  }
  return data;
}

export async function updateEconomyRules(
  rules: EconomyRules,
): Promise<EconomyResponse> {
  const res = await fetch(`${BASE_URL}/economy/rules`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(rules),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to update economy rules");
  }
  return data;
}
