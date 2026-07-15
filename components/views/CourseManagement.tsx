import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileBox,
  Tag,
  Eye,
  MoreVertical,
  Sparkles,
  Plus,
  Layers,
  Box,
  FolderPlus,
  Trash2,
  ChevronLeft,
  Save,
  Calendar,
  X,
  Check,
  AlertCircle,
  FileText,
  Loader2,
  Edit2,
  Play,
  Maximize,
  ChevronRight,
} from "lucide-react";
import { Course, Module, Lesson } from "../../types";
import { generateCourseTags } from "../../services/geminiService";
import { authFetch } from "../../services/authFetch";
import { getApiV1BaseUrl } from "@/lib/apiConfig";

const API_BASE = getApiV1BaseUrl();

interface ScormUploadResponse {
  id: string;
  filename: string;
  uploadedAt: string;
  storagePath: string;
  scormVersion: "SCORM_1.2" | "SCORM_2004";
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"LIST" | "VIEW" | "EDITOR">("LIST");
  const [loadingCourse, setLoadingCourse] = useState(false);

  // Editor State
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);

  // SCORM Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadTrigger, setUploadTrigger] = useState<{
    moduleId: string;
    lessonId: string;
  } | null>(null);
  const [uploadingScorm, setUploadingScorm] = useState(false);
  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    moduleId: string;
    lessonId: string;
    file: File | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    moduleId: "",
    lessonId: "",
    file: null,
    title: "",
    description: "",
  });

  const imageRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [courseImagePreview, setCourseImagePreview] = useState<String | null>(
    null,
  );

  // Preview State
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    courseId: string | null;
  }>({
    isOpen: false,
    courseId: null,
  });

  const normalizeCourseData = (course: Course): Course => ({
    ...course,
    title: course.title || "",
    description: course.description || "",
    version: course.version || "",
    visibility: course.visibility || "INTERNAL",
    tags: Array.isArray(course.tags) ? course.tags : [],
    modules: Array.isArray(course.modules) ? course.modules : [],
    imageUrl: course.imageUrl || undefined,
    passingScore: (course as any).passingScore ?? 70,
    requireQuizPass: (course as any).requireQuizPass ?? true,
    modulePacingEnabled: (course as any).modulePacingEnabled ?? false,
    modulePacingDays: (course as any).modulePacingDays ?? 7,
    pacingStartDate: (course as any).pacingStartDate ?? null,
    scormPackageId: (course as any).scormPackageId ?? null,
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await authFetch(`${API_BASE}/courses`);

      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await res.json();
      setCourses(data.data ?? data);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const createDraftCourse = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No access token found");
    }

    const res = await fetch(
      `${API_BASE}/courses/draft`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Course" }),
      },
    );

    if (!res.ok) {
      throw new Error("Failed to create draft course");
    }
    const data = await res.json();
    return data.data ?? data;
  };

  const initCreateCourse = async () => {
    if (creatingDraft) return;

    try {
      setCreatingDraft(true);

      const draft = await createDraftCourse();
      const normalizedDraft = normalizeCourseData(draft);

      setActiveCourse(normalizedDraft);
      setViewMode("EDITOR");
    } catch (err) {
      console.error(err);
      alert("Failed to create course draft");
    }
  };

  const uploadScormPackage = async (file: File) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const formData = new FormData();
    formData.append("package", file);

    const res = await fetch(
      `${API_BASE}/scorm-packages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    const text = await res.text();
    let payload: { error?: string; message?: string } | null = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!res.ok) {
      const message =
        payload?.error ||
        payload?.message ||
        text ||
        "SCORM upload failed";
      console.error("SCORM upload backend error:", message);
      throw new Error(message);
    }

    const json = payload as { data: ScormUploadResponse };
    return json.data;
  };

  const uploadCourseImage = async (courseId: string, file: File) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      `${API_BASE}/courses/${courseId}/image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Course image upload error:", text);
      throw new Error(text || "Failed to upload course image");
    }

    const data = await res.json();
    return data.data ?? data;
  };

  const buildCourseUpsertPayload = (course: Course) => {
    const payload = {
      id: course.id,
      title: course.title,
      description: course.description,
      tags: course.tags?.length ? course.tags : null,
      visibility: course.visibility ?? null,
      version: course.version ?? null,
      status: "PUBLISHED",
      passingScore: (course as any).passingScore ?? 70,
      requireQuizPass: (course as any).requireQuizPass ?? true,
      modulePacingEnabled: (course as any).modulePacingEnabled ?? false,
      modulePacingDays: (course as any).modulePacingDays ?? 7,
      pacingStartDate: (course as any).pacingStartDate ?? null,
      scormPackageId: (course as any).scormPackageId ?? null,
      modules: (course.modules ?? []).map((module) => ({
        id: module.id,
        name: module.name || "Untitled Module",
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || "",
          scormPackageId: lesson.content?.id ?? null,
        })),
      })),
    };

    console.log("FINAL LESSON PAYLOAD:", payload.modules[0].lessons);
    return payload;
  };

  const publishCourse = async (course: Course) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const payload = buildCourseUpsertPayload(course);

    const res = await fetch(
      `${API_BASE}/courses/${course.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to publish course");
    }

    const data = await res.json();
    return data;
  };

  const handleCourseImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!activeCourse) return;

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const previewUrl = URL.createObjectURL(file);

      const response = await uploadCourseImage(activeCourse.id, file);

      if (response?.url) {
        updateCourseField("imageUrl", response.url);
        setCourseImagePreview(response.url);
      }
    } catch (err) {
      console.error(err);
      alert("Fail to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePublishCourse = async () => {
    if (!activeCourse) return;

    try {
      const publishedCourse = await publishCourse(activeCourse);

      // normalize nulls from backend
      const normalized = normalizeCourseData(publishedCourse);

      setActiveCourse(normalized);
      setViewMode("LIST");

      // replace draft in table with published course
      setCourses((prev) =>
        prev.map((c) => (c.id === normalized.id ? normalized : c)),
      );
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    }
  };

  const updateCourseField = (field: keyof Course, value: any) => {
    if (!activeCourse) return;
    setActiveCourse({ ...activeCourse, [field]: value });
  };

  // --- Hierarchy Management ---

  const addModule = () => {
    if (!activeCourse) return;
    const newModule: Module = {
      id: Math.random().toString(36).substr(2, 9),
      name: "New Module",
      lessons: [],
    };
    updateCourseField("modules", [...(activeCourse.modules || []), newModule]);
  };

  const updateModuleTitle = (moduleId: string, newTitle: string) => {
    if (!activeCourse) return;
    const updatedModules = activeCourse.modules?.map((m) =>
      m.id === moduleId ? { ...m, name: newTitle } : m,
    );
    updateCourseField("modules", updatedModules);
  };

  const removeModule = async (moduleId: string) => {
    if (!activeCourse) return;

    try {
      await deleteModule(activeCourse.id, moduleId);

      updateCourseField(
        "modules",
        (activeCourse.modules ?? []).filter((m) => m.id !== moduleId),
      );
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    }
  };

  const addLesson = (moduleId: string) => {
    if (!activeCourse) return;
    const newLesson: Lesson = {
      id: Math.random().toString(36).substr(2, 9),
      title: "New Lesson",
      type: "SCORM",
    };
    const updatedModules = activeCourse.modules?.map((m) => {
      if (m.id === moduleId) {
        return { ...m, lessons: [...m.lessons, newLesson] };
      }
      return m;
    });
    updateCourseField("modules", updatedModules);
  };

  const updateLesson = (
    moduleId: string,
    lessonId: string,
    updates: Partial<Lesson>,
  ) => {
    if (!activeCourse) return;

    const updatedModules = activeCourse.modules?.map((m) => {
      if (m.id === moduleId) {
        const updatedLessons = m.lessons.map((l) => {
          if (l.id === lessonId) {
            const updatedLesson = { ...l, ...updates };
            console.log("Updated lesson payload:", updatedLesson); // 👈 here
            return updatedLesson;
          }
          return l;
        });
        return { ...m, lessons: updatedLessons };
      }
      return m;
    });

    updateCourseField("modules", updatedModules);
  };

  const deleteCourse = async (courseId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const res = await fetch(
      `${API_BASE}/courses/${courseId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to delete course");
    }
  };

  const deleteModule = async (courseId: string, moduleId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const res = await fetch(
      `${API_BASE}/courses/${courseId}/modules/${moduleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to delete module");
    }
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    if (!activeCourse) return;
    const updatedModules = activeCourse.modules?.map((m) => {
      if (m.id === moduleId) {
        return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) };
      }
      return m;
    });
    updateCourseField("modules", updatedModules);
  };

  // --- SCORM Upload Logic ---

  const initiateUpload = (moduleId: string, lessonId: string) => {
    setUploadTrigger({ moduleId, lessonId });
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTrigger && activeCourse) {
      // Find current lesson info to pre-fill
      const module = activeCourse.modules?.find(
        (m) => m.id === uploadTrigger.moduleId,
      );
      const lesson = module?.lessons.find(
        (l) => l.id === uploadTrigger.lessonId,
      );

      setUploadModal({
        isOpen: true,
        moduleId: uploadTrigger.moduleId,
        lessonId: uploadTrigger.lessonId,
        file: file,
        title:
          lesson?.title === "New Lesson"
            ? file.name.replace(/\.[^/.]+$/, "")
            : lesson?.title || "",
        description: lesson?.description || "",
      });
    }
  };

  const confirmUpload = async () => {
    if (!uploadModal.file) return;

    try {
      setUploadingScorm(true);
      const scorm = await uploadScormPackage(uploadModal.file);
      console.log("SCORM API response:", scorm); // 👈 raw payload

      updateLesson(uploadModal.moduleId, uploadModal.lessonId, {
        title: uploadModal.title,
        description: uploadModal.description,
        content: {
          id: scorm.id,
          fileName: scorm.filename,
          uploadDate: scorm.uploadedAt.split("T")[0],
          size: `${(uploadModal.file.size / (1024 * 1024)).toFixed(2)} MB`,
          storagePath: scorm.storagePath,
          scormVersion: scorm.scormVersion,
        },
      });

      setUploadModal({ ...uploadModal, isOpen: false, file: null });
      setUploadTrigger(null);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to upload SCORM package",
      );
    } finally {
      setUploadingScorm(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!activeCourse?.title) return;
    setGeneratingTags(true);
    const tags = await generateCourseTags(
      activeCourse.title,
      activeCourse.description || "",
    );
    updateCourseField("tags", tags);
    setGeneratingTags(false);
  };

  const initiateDeleteCourse = (courseId: string) => {
    setDeleteModal({ isOpen: true, courseId });
  };

  const confirmDeleteCourse = async () => {
    if (!deleteModal.courseId) return;

    try {
      await deleteCourse(deleteModal.courseId);

      setCourses((prev) => prev.filter((c) => c.id !== deleteModal.courseId));

      if (activeCourse?.id === deleteModal.courseId) {
        setActiveCourse(null);
        setViewMode("LIST");
      }

      setDeleteModal({ isOpen: false, courseId: null });
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    }
  };

  const fetchCourseById = async (courseId: string): Promise<Course> => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No access token found");

    const res = await fetch(
      `${API_BASE}/courses/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to fetch course");
    }

    const data = await res.json();
    return normalizeCourseData(data.data ?? data);
  };

  const handleViewCourse = async (courseId: string) => {
    try {
      setLoadingCourse(true);
      const fullCourse = await fetchCourseById(courseId);
      setActiveCourse(fullCourse);
      setViewMode("VIEW");
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setLoadingCourse(false);
    }
  };

  // --- RENDERERS ---

  if (viewMode === "VIEW" && activeCourse) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        {/* ===== SCORM PREVIEW MODAL ===== */}
        {previewLesson?.content && (
          <div className="fixed inset-0 z-200 bg-black/80 flex items-center justify-center">
            <div className="bg-white w-full h-full md:w-[90vw] md:h-[90vh] rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <p className="font-semibold">{previewLesson.title}</p>
                  <p className="text-xs text-slate-400">
                    SCORM {previewLesson.content.scormVersion}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewLesson(null)}
                  className="p-2 hover:bg-slate-800 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <iframe
                src={`${API_BASE}/scorm-packages/${previewLesson.content.id}/launch`}
                className="flex-1 w-full border-none"
                allow="fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title="SCORM Player"
              />
            </div>
          </div>
        )}

        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode("LIST")}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {activeCourse.title}
              </h2>
              <p className="text-sm text-gray-500">
                v{activeCourse.version} • {activeCourse.visibility}
              </p>
            </div>
          </div>
        </div>

        {/* ===== METADATA ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className="font-semibold">{activeCourse.status}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border">
            <p className="text-xs text-gray-500 mb-1">Modules</p>
            <p className="font-semibold">{(activeCourse.modules ?? []).length}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border">
            <p className="text-xs text-gray-500 mb-1">Lessons</p>
            <p className="font-semibold">
              {(activeCourse.modules ?? []).reduce(
                (sum, m) => sum + m.lessons.length,
                0,
              )}
            </p>
          </div>
        </div>

        {/* ===== DESCRIPTION ===== */}
        {activeCourse.description && (
          <div className="bg-white p-6 rounded-xl border">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-600 text-sm">{activeCourse.description}</p>
          </div>
        )}

        {/* ===== CURRICULUM ===== */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Layers size={18} /> Curriculum
          </h3>

          {(activeCourse.modules ?? []).map((module, idx) => (
            <div
              key={module.id}
              className="bg-white border rounded-xl overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-3 font-semibold">
                {idx + 1}. {module.name}
              </div>

              <ul className="divide-y">
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="px-4 py-3 flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-700">{lesson.title}</span>

                    {lesson.content && (
                      <button
                        onClick={() => setPreviewLesson(lesson)}
                        className="text-xs text-brand-primary hover:underline flex items-center gap-1"
                      >
                        <Play size={12} /> Preview
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === "EDITOR" && activeCourse) {
    return (
      <div className="space-y-6 animate-fade-in pb-20 relative">
        {/* Hidden File Input */}
        <input
          type="file"
          accept=".zip"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />

        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          className="hidden"
          onChange={handleCourseImageSelect}
        />

        {/* Upload Modal */}
        {uploadModal.isOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Upload SCORM Package
                  </h3>
                  <p className="text-sm text-gray-500">
                    Review package details before saving
                  </p>
                </div>
                <button
                  onClick={() =>
                    setUploadModal({ ...uploadModal, isOpen: false })
                  }
                  className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4 bg-brand-primary/10 p-4 rounded-lg border border-brand-primary/20">
                  <div className="bg-brand-primary/10 p-3 rounded-lg text-brand-primary">
                    <Box size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {uploadModal.file?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(uploadModal.file!.size / (1024 * 1024)).toFixed(2)} MB •
                      Ready to process
                    </p>
                    {uploadModal.file!.size > 100 * 1024 * 1024 && (
                      <p className="text-xs text-amber-700 mt-1">
                        Large package — upload may take several minutes. Keep this tab open.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    value={uploadModal.title}
                    onChange={(e) =>
                      setUploadModal({ ...uploadModal, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    placeholder="Enter lesson title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={uploadModal.description}
                    onChange={(e) =>
                      setUploadModal({
                        ...uploadModal,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none h-24 resize-none"
                    placeholder="Describe what is covered in this module..."
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() =>
                    setUploadModal({ ...uploadModal, isOpen: false })
                  }
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpload}
                  disabled={!uploadModal.title || uploadingScorm}
                  className="px-6 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploadingScorm ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                  {uploadingScorm ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-slate-50 z-10 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode("LIST")}
              className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-200 text-gray-500 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {activeCourse.title || "Untitled Course"}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    activeCourse.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeCourse.status === "PUBLISHED"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                  ></span>
                  {activeCourse.status}
                </span>
                <span>v{activeCourse.version}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePublishCourse}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Publish Course
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left: Configuration */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileBox size={18} className="text-brand-primary" /> Course Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={activeCourse.title || ""}
                    onChange={(e) => updateCourseField("title", e.target.value)}
                    placeholder="e.g. Fire Safety 101"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={activeCourse.description || ""}
                    onChange={(e) =>
                      updateCourseField("description", e.target.value)
                    }
                    placeholder="Brief summary of the course..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none h-32 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                    {courseImagePreview || (activeCourse as any).imageUrl ? (
                      <div className="space-y-3">
                        <img
                          src={
                            courseImagePreview || (activeCourse as any).imageUrl
                          }
                          alt="Course"
                          className="w-full h-40 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-100"
                        >
                          Replace Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload
                          className="mx-auto text-gray-400 mb-2"
                          size={24}
                        />
                        <p className="text-sm text-gray-600 mb-2">
                          Upload course thumbnail
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            console.log("Image click", imageInputRef.current);
                            imageInputRef.current?.click();
                          }}
                          className="px-4 py-2 bg-white border border-gray-300 text-xs rounded hover:bg-gray-100"
                        >
                          Select Image
                        </button>
                      </div>
                    )}

                    {uploadingImage && (
                      <p className="text-xs text-brand-primary mt-2">Uploading...</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quiz Passing Score (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={(activeCourse as any).passingScore ?? 70}
                      onChange={(e) =>
                        updateCourseField(
                          "passingScore" as keyof Course,
                          Number(e.target.value),
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
                      <input
                        type="checkbox"
                        checked={(activeCourse as any).requireQuizPass ?? true}
                        onChange={(e) =>
                          updateCourseField(
                            "requireQuizPass" as keyof Course,
                            e.target.checked,
                          )
                        }
                      />
                      Require quiz pass to complete
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Weekly module pacing (one SCORM zip)
                  </h3>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={(activeCourse as any).modulePacingEnabled ?? false}
                      onChange={(e) =>
                        updateCourseField(
                          "modulePacingEnabled" as keyof Course,
                          e.target.checked,
                        )
                      }
                    />
                    Enable fixed cohort calendar pacing
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cohort start date (Week 1 unlocks)
                      </label>
                      <input
                        type="date"
                        value={
                          (activeCourse as any).pacingStartDate
                            ? String((activeCourse as any).pacingStartDate).slice(0, 10)
                            : ""
                        }
                        onChange={(e) =>
                          updateCourseField(
                            "pacingStartDate" as keyof Course,
                            e.target.value ? `${e.target.value}T00:00:00.000Z` : null,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days between module unlocks
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={(activeCourse as any).modulePacingDays ?? 7}
                        onChange={(e) =>
                          updateCourseField(
                            "modulePacingDays" as keyof Course,
                            Number(e.target.value),
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    All trainees share the same unlock dates. Module N unlocks on
                    cohort start + (N − 1) × interval days. Completing a prior
                    module is not required for the next to unlock.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Version
                    </label>
                    <input
                      type="text"
                      value={activeCourse.version || ""}
                      onChange={(e) =>
                        updateCourseField("version", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility
                    </label>
                    <select
                      value={activeCourse.visibility || ""}
                      onChange={(e) =>
                        updateCourseField("visibility", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                    >
                      <option value="Internal">Internal</option>
                      <option value="External">External</option>
                      <option value="Department">Department</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex justify-between">
                    <span>Tags</span>
                    <button
                      onClick={handleGenerateTags}
                      disabled={generatingTags || !activeCourse.title}
                      className="text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded inline-flex items-center transition-colors disabled:opacity-50"
                    >
                      {generatingTags ? (
                        <Loader2 size={12} className="animate-spin mr-1" />
                      ) : (
                        <Sparkles size={12} className="mr-1" />
                      )}
                      {generatingTags ? "Generating..." : "AI Suggest"}
                    </button>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[50px] bg-gray-50/50">
                    {activeCourse.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs flex items-center shadow-sm"
                      >
                        {tag}
                        <button
                          onClick={() =>
                            updateCourseField(
                              "tags",
                              activeCourse.tags.filter((t) => t !== tag),
                            )
                          }
                          className="ml-1 text-gray-400 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {activeCourse.tags.length === 0 && (
                      <span className="text-gray-400 text-sm italic px-1">
                        No tags added
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Curriculum Builder */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Layers size={18} className="text-brand-primary" /> Curriculum
                Builder
              </h3>
              <button
                onClick={addModule}
                className="text-sm bg-brand-primary text-white px-3 py-1.5 rounded-lg hover:bg-brand-primary-dark flex items-center gap-1 shadow-sm transition-colors"
              >
                <Plus size={16} /> Add Module
              </button>
            </div>

            {(!activeCourse.modules || activeCourse.modules.length === 0) && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-white">
                <Box size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No modules yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Start building your course structure
                </p>
                <button
                  onClick={addModule}
                  className="text-brand-primary font-medium hover:underline"
                >
                  Create first module
                </button>
              </div>
            )}

            <div className="space-y-6">
              {activeCourse.modules?.map((module, mIdx) => (
                <div
                  key={module.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Module Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between group">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold w-6 h-6 rounded flex items-center justify-center">
                        {mIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={module.name}
                        onChange={(e) =>
                          updateModuleTitle(module.id, e.target.value)
                        }
                        className="bg-transparent border-none focus:ring-0 font-semibold text-gray-700 w-full placeholder-gray-400"
                        placeholder="Module Title..."
                      />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeModule(module.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete Module"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Lessons List */}
                  <div className="p-4 space-y-4">
                    {module.lessons.map((lesson, lIdx) => (
                      <div
                        key={lesson.id}
                        className="border border-gray-100 rounded-lg p-4 hover:border-brand-primary/30 transition-all bg-white shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                              <FileBox size={16} />
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            {/* Lesson Header */}
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) =>
                                  updateLesson(module.id, lesson.id, {
                                    title: e.target.value,
                                  })
                                }
                                className="font-medium text-gray-800 border-b border-transparent focus:border-brand-primary/30 focus:outline-none w-full max-w-md pb-0.5"
                                placeholder="Lesson Title"
                              />
                              <button
                                onClick={() =>
                                  removeLesson(module.id, lesson.id)
                                }
                                className="text-gray-300 hover:text-red-500 transition-colors"
                                title="Delete Lesson"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* SCORM Quick Summary - Requested to be below title */}
                            {lesson.content && (
                              <div className="text-xs text-slate-500 flex items-center gap-3 font-mono">
                                <span className="font-medium text-slate-700 flex items-center gap-1">
                                  <Box size={12} /> {lesson.content.fileName}
                                </span>
                                <span className="flex items-center gap-1 opacity-75">
                                  <Calendar size={10} />{" "}
                                  {lesson.content.uploadDate}
                                </span>
                                <span className="flex items-center gap-1 opacity-75">
                                  <FileText size={10} /> {lesson.content.size}
                                </span>
                              </div>
                            )}

                            {/* Description */}
                            <textarea
                              value={lesson.description || ""}
                              onChange={(e) =>
                                updateLesson(module.id, lesson.id, {
                                  description: e.target.value,
                                })
                              }
                              className="w-full text-sm text-gray-600 border border-transparent hover:border-gray-200 focus:border-brand-primary/30 rounded p-1.5 focus:outline-none resize-none transition-colors"
                              placeholder="Add lesson description..."
                              rows={2}
                            />

                            {/* SCORM Upload Area */}
                            {!lesson.content ? (
                              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-center">
                                <div className="bg-white p-2 rounded-full shadow-sm mb-3">
                                  <Upload size={20} className="text-brand-primary" />
                                </div>
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Upload SCORM Package
                                </p>
                                <p className="text-xs text-gray-400 mb-3">
                                  Supported formats: .zip (SCORM 1.2/2004)
                                </p>
                                <button
                                  onClick={() =>
                                    initiateUpload(module.id, lesson.id)
                                  }
                                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                  Select File
                                </button>
                              </div>
                            ) : (
                              <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="bg-green-100 p-2 rounded text-green-700">
                                    <Box size={18} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {lesson.content.fileName}
                                    </p>
                                    <div className="text-xs text-green-700/70 flex gap-3 mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Calendar size={10} />{" "}
                                        {lesson.content.uploadDate}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FileText size={10} />{" "}
                                        {lesson.content.size}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      initiateUpload(module.id, lesson.id)
                                    }
                                    className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 transition-colors"
                                  >
                                    Replace
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addLesson(module.id)}
                      className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/10/50 transition-all flex items-center justify-center gap-2"
                    >
                      <FolderPlus size={16} /> Add New Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Delete Course?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this course? This action cannot
                be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() =>
                    setDeleteModal({ isOpen: false, courseId: null })
                  }
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCourse}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Course Management
          </h2>
          <p className="text-gray-500">
            Manage courses, modules, and SCORM content
          </p>
        </div>
        <button
          onClick={initCreateCourse}
          disabled={creatingDraft}
          className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          {creatingDraft ? "Creating Course..." : "Create Course"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Course Info
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Structure
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Tags
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Visibility
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  <Calendar size={12} /> Upload Date
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  Loading courses...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-red-500">
                  Error loading courses: {error}
                </td>
              </tr>
            )}

            {!loading && !error && courses.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No courses found
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              courses.map((course) => (
                <tr
                  key={course.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-brand-primary/10 p-2 rounded text-brand-primary">
                        <FileBox size={20} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {course.title}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-gray-400" />
                      <span>{course.modules?.length ?? 0} Modules</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(course.tags ?? []).slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {(course.tags?.length ?? 0) > 2 && (
                        <span className="text-xs text-gray-400">
                          +{course.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Eye size={14} /> {course.visibility}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {course.createdAt
                      ? new Date(course.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border inline-block ${
                        course.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : course.status === "DRAFT"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {course.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewCourse(course.id)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="View Course"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            setLoadingCourse(true);

                            const fullCourse = await fetchCourseById(course.id);

                            setActiveCourse(fullCourse);
                            setViewMode("EDITOR");
                          } catch (err) {
                            console.error(err);
                            alert((err as Error).message);
                          } finally {
                            setLoadingCourse(false);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors"
                        title="Edit Course"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => initiateDeleteCourse(course.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseManagement;
