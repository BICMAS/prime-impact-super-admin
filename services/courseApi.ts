import { authJson, authUpload } from "@/lib/authHelpers";
import { authFetch } from "./authFetch";
import { Course, ScormPackage } from "@/types";
import { getApiV1BaseUrl } from "@/lib/apiConfig";

const BASE_URL = getApiV1BaseUrl();

/* =========================
   CREATE
========================= */

export const createDraftCourse = (title: string) =>
  authJson<Course>(`${BASE_URL}/courses/draft`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });

/* =========================
   SAVE (CRITICAL FIX)
========================= */

/**
 * Saves a draft course.
 * IMPORTANT:
 * - payload must NOT contain ids
 * - payload must match Postman structure
 */
export const saveCourse = (
  courseId: string,
  payload: {
    title?: string;
    description?: string;
    visibility?: string | null;
    version?: string | null;
    tags?: string[] | null;
    modules: {
      name: string;
      lessons: {
        title: string;
        description?: string;
        scormPackageId?: string | null;
      }[];
    }[];
  }
) =>
  authJson<Course>(`${BASE_URL}/courses/${courseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

/* =========================
   PUBLISH
========================= */

export const publishCourse = (courseId: string) =>
  authJson<Course>(`${BASE_URL}/courses/${courseId}/publish`, {
    method: "PATCH",
  });

/* =========================
   SCORM
========================= */

export const uploadScorm = (file: File): Promise<ScormPackage> => {
  const formData = new FormData();

  // MUST match backend FileInterceptor name
  formData.append("package", file);

  return authUpload<ScormPackage>(
    `${BASE_URL}/scorm-packages`,
    formData
  );
};

/* =========================
   DELETE COURSE
========================= */

export const deleteCourse = async (courseId: string): Promise<void> => {
  const res = await authFetch(`${BASE_URL}/courses/${courseId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete course");
  }
};

/* =========================
   DELETE MODULE
========================= */

export const deleteModule = async (
  courseId: string,
  moduleId: string
): Promise<void> => {
  const res = await authFetch(
    `${BASE_URL}/courses/${courseId}/modules/${moduleId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete module");
  }
};

/* =========================
   LIST
========================= */

export const getAllCourses = () =>
  authJson<Course[]>(`${BASE_URL}/courses`);
