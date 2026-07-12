import { getAccessToken } from '@/utils/auth';
import { getApiV1BaseUrl } from '@/lib/apiConfig';

const BASE_URL = getApiV1BaseUrl();

export type CertificateTheme = 'classic' | 'modern' | 'tech';

export interface CertificateThemeConfig {
  theme: CertificateTheme;
  title: string;
  signatory: string;
  signatoryRole: string;
  showDate: boolean;
}

export interface CreateCertificateTemplateResponse {
  url: string;
  id: string;
  filename: string;
  downloadUrl: string;
}

export interface AssignCertificateTemplateToHrPayload {
  templateId: string;
  orgId: string;
  hrManagerId: string;
}

export interface AssignCertificateTemplateToHrResponse {
  message: string;
  templateId: string;
  orgId: string;
  hrManagerId: string;
  reissuedCount?: number;
  errors?: Array<{
    certificateId: string;
    userId: string;
    courseId: string;
    error: string;
  }>;
}

function authHeader() {
  const token = getAccessToken();
  if (!token) throw new Error('Missing access token');

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function readError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
}

function assertLogoFile(file: File) {
  const allowedMimeTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ]);
  const lowerName = file.name.toLowerCase();
  const isAllowedMime = allowedMimeTypes.has(file.type);
  const isAllowedExt = ['.png', '.jpg', '.jpeg', '.webp'].some((ext) =>
    lowerName.endsWith(ext)
  );

  if (!isAllowedMime && !isAllowedExt) {
    throw new Error('Only PNG, JPG, or WEBP logo files are allowed');
  }
}

export async function createCertificateTemplate(
  logo: File,
  themeConfig: CertificateThemeConfig,
  description?: string
): Promise<CreateCertificateTemplateResponse> {
  assertLogoFile(logo);

  const formData = new FormData();
  formData.append('logo', logo);
  formData.append('themeConfig', JSON.stringify(themeConfig));
  if (description) {
    formData.append('description', description);
  }

  const res = await fetch(`${BASE_URL}/certificates`, {
    method: 'POST',
    headers: authHeader(),
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await readError(res, 'Failed to create certificate template'));
  }

  return res.json();
}

export async function assignCertificateTemplateToHr(
  payload: AssignCertificateTemplateToHrPayload
): Promise<AssignCertificateTemplateToHrResponse> {
  const res = await fetch(`${BASE_URL}/certificates/assign-to-hr`, {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      await readError(res, 'Failed to assign certificate template to HR manager')
    );
  }

  return res.json();
}

async function downloadTemplateFromPath(path: string): Promise<Blob> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error(await readError(res, 'Failed to download certificate template'));
  }

  return res.blob();
}

export async function downloadLatestCertificateTemplate(): Promise<Blob> {
  return downloadTemplateFromPath('/certificates/latest/download');
}

export async function downloadCertificateTemplateById(id: string): Promise<Blob> {
  if (!id) {
    throw new Error('Certificate template id is required');
  }

  return downloadTemplateFromPath(`/certificates/${encodeURIComponent(id)}/download`);
}

export function saveCertificateTemplateBlob(blob: Blob, filename: string) {
  if (!blob) throw new Error('Certificate template blob is required');
  if (!filename) throw new Error('Certificate template filename is required');

  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.URL.revokeObjectURL(objectUrl);
}

export async function downloadLatestCertificateTemplateToFile(
  filename = 'latest-certificate-logo.png'
) {
  const blob = await downloadLatestCertificateTemplate();
  saveCertificateTemplateBlob(blob, filename);
}

export async function downloadCertificateTemplateByIdToFile(
  id: string,
  filename = `certificate-logo-${id}.png`
) {
  const blob = await downloadCertificateTemplateById(id);
  saveCertificateTemplateBlob(blob, filename);
}
