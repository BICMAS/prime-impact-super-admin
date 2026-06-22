const BASE_URL =
  'https://bicmas-academy-main-backend-production.up.railway.app/api/v1';

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }

  if (!data.accessToken) {
    throw new Error('No access token in return');
  }

  localStorage.setItem('accessToken', data.accessToken);
  return data;
}


export function logout() {
  localStorage.removeItem('accessToken');
  sessionStorage.clear();
  window.location.replace('/');
}

