import { authFetch } from "@/services/authFetch";


export async function authJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");

    const res = await authFetch(url, options);
    const text = await res.text();

    if (!text) return {} as T;

    try {
       return JSON.parse(text) 
    } catch  {
        throw new Error('Invalid JSON response');
    }
}

export async function authUpload<T>(url: string, formData: FormData): Promise<T> {
    const res = await authFetch(url, {
        method: "POST",
        body: formData,
    })

    return res.json();
}

