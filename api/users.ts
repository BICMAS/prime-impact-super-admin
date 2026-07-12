import { User } from "@/types";
import { getAccessToken } from "@/utils/auth";
import { getApiV1BaseUrl } from "@/lib/apiConfig";

const BASE_URL = getApiV1BaseUrl();

function authHeaders() {
    const token = getAccessToken()
    if (!token) throw new Error('Missing access token')
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
}


export async function createUser(payload: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    password: string;
    userRole: string;
    department: string;
}): Promise<User> {
    const res = await fetch(`${BASE_URL}/users/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create user');
    }

    return data;
}

export async function getUserById(userId: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch user');
    }

    return data;
}

export async function updateUser(
  userId: string,
  payload: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    userRole?: string;
    department?: string;
    password?: string;
    status?: string;
  }
): Promise<User> {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to update user');
    }

    return data;
}

export async function bulkUploadUsers(file: File) {
  const token = getAccessToken();
  if (!token) throw new Error('Missing access token');

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/bulk-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Bulk upload failed');

  return data;
}

export async function blockUser(userId: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/${userId}/block`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to block user");
  }

  return data;
}

export async function unblockUser(userId: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/${userId}/unblock`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to unblock user");
  }

  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (res.status === 204) return;

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to delete user");
  }
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/users`, {
    headers: authHeaders(),
    cache: 'no-store', // ✅ important
  });

  console.log('Fetch users response status:', res.status);

  if (res.status === 204) {
    console.log('No users found, returning empty array.');
    return [];
  }

  const data = await res.json();

  console.log('Fetched users data:', data);

  if (!res.ok) {
    console.error('Error fetching users:', data);
    throw new Error(data.error || data.message || 'Failed to fetch users');
  }

  return data;
}

