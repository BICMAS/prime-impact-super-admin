import { authFetch } from "./authFetch";

const API_BASE =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

export const fetchSuperDashboard = async () => {
  const res = await authFetch(`${API_BASE}/dashboard/super`);

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
};
