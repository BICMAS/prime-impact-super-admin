import { authFetch } from "./authFetch";
import { getApiV1BaseUrl } from "@/lib/apiConfig";

const API_BASE = getApiV1BaseUrl();

export const fetchSuperDashboard = async () => {
  const res = await authFetch(`${API_BASE}/dashboard/super`);

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
};
