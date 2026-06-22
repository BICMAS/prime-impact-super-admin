import { getAccessToken } from '@/utils/auth';

const BASE_URL = 'https://bicmas-academy-main-backend-production.up.railway.app/api/v1';

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

function assertPdfTemplate(file: File) {
  const isPdfMime = file.type === 'application/pdf';
  const isPdfName = file.name.toLowerCase().endsWith('.pdf');

  if (!isPdfMime && !isPdfName) {
    throw new Error('Only PDF templates allowed');
  }
}

export async function createCertificateTemplate(
  template: File,
  description?: string
): Promise<CreateCertificateTemplateResponse> {
  assertPdfTemplate(template);

  const formData = new FormData();
  formData.append('template', template);
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
  filename = 'latest-certificate-template.pdf'
) {
  const blob = await downloadLatestCertificateTemplate();
  saveCertificateTemplateBlob(blob, filename);
}

export async function downloadCertificateTemplateByIdToFile(
  id: string,
  filename = `certificate-template-${id}.pdf`
) {
  const blob = await downloadCertificateTemplateById(id);
  saveCertificateTemplateBlob(blob, filename);
}
