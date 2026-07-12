import { getApiV1BaseUrl } from '@/lib/apiConfig';

export async function login(email: string, password: string) {
  const res = await fetch(`${getApiV1BaseUrl()}/auth/login`, {
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
