import React, { useEffect, useState } from "react";
import {
  Plus,
  GripVertical,
  Trash2,
  ArrowRight,
  Save,
  Sparkles,
} from "lucide-react";
import { Course } from "../../types";
import { suggestLearningPathDescription } from "../../services/geminiService";
import { authFetch } from "../../services/authFetch";
import { getApiV1BaseUrl } from "@/lib/apiConfig";

/* =====================
   API
===================== */

const API_BASE = getApiV1BaseUrl();

/* =====================
   Types
===================== */

type LearningPathResponse = {
  id: string;
  title: string;
  description: string;
  enrolmentRule: string;
  curriculumSequence: string[];
  status: string;
};

/* =====================
   TEMP Course Library
===================== */

const courseLibraryMock: Course[] = [
  {
    id: "cmjehsz2x0000swui5qgbhe2p",
    title: "Math Fundamentals",
    version: "1.0",
    tags: ["Math"],
    visibility: "INTERNAL",
    status: "DRAFT",
    uploadDate: "2024-01-01",
  },
];

/* =====================
   Component
===================== */

const LearningPaths: React.FC = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [pathId, setPathId] = useState<string | null>(null);
  const [pathTitle, setPathTitle] = useState("");
  const [description, setDescription] = useState("");
  const [enrolmentRule, setEnrolmentRule] = useState("manual");

  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =====================
     Load Existing Path (optional preview only)
     NOTE: This does NOT mean edit — saves will create new records.
  ===================== */

  useEffect(() => {
    const loadLearningPath = async () => {
      try {
        const res = await authFetch(`${API_BASE}/learning-paths`);
        if (!res.ok) throw new Error("Failed to fetch learning paths");

        const json = await res.json();

        const path: LearningPathResponse | null = Array.isArray(json)
          ? (json[0] ?? null)
          : (json ?? null);

        if (!path) {
          setLoading(false);
          return;
        }

        // Populate UI for convenience (acts like a template)
        setPathId(path.id);
        setPathTitle(path.title || "");
        setDescription(path.description || "");
        setEnrolmentRule(path.enrolmentRule || "manual");

        const mappedCourses = (path.curriculumSequence || [])
          .map((id) => courseLibraryMock.find((c) => c.id === id))
          .filter(Boolean) as Course[];

        setSelectedCourses(mappedCourses);
      } catch (err) {
        console.error("Failed to load learning path", err);
      } finally {
        setLoading(false);
      }
    };

    loadLearningPath();
  }, []);

  /* =====================
     Save Path (POST ONLY)
     Always creates a new learning path
  ===================== */

  const handleSavePath = async () => {
    if (!pathTitle.trim()) {
      setError("Path title is required");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title: pathTitle,
      description,
      enrolmentRule,
      curriculumSequence: selectedCourses.map((c) => c.id),
      status: "DRAFT",
    };

    try {
      console.log("Creating new learning path...");

      const res = await authFetch(`${API_BASE}/learning-paths`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Save failed");
      }

      const saved = await res.json();

      console.log("Created learning path:", saved.id);

      // Update local state to the newly created version
      setPathId(saved.id);
    } catch (err) {
      console.error(err);
      setError("Failed to save learning path");
    } finally {
      setSaving(false);
    }
  };

  /* =====================
     Load Courses
  ===================== */

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await authFetch(`${API_BASE}/courses`);
        if (!res.ok) throw new Error("Failed to load courses");

        const json = await res.json();
        setCourses(Array.isArray(json) ? json : (json.data ?? []));
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, []);

  /* =====================
     Actions
  ===================== */

  const addCourse = (course: Course) => {
    if (!selectedCourses.some((c) => c.id === course.id)) {
      setSelectedCourses((prev) => [...prev, course]);
    }
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const moveCourse = (index: number, direction: "up" | "down") => {
    const next = [...selectedCourses];

    if (direction === "up" && index > 0) {
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
    }

    if (direction === "down" && index < next.length - 1) {
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
    }

    setSelectedCourses(next);
  };

  const handleAiDescription = async () => {
    if (!selectedCourses.length) return;

    setIsSuggesting(true);

    const suggestion = await suggestLearningPathDescription(
      pathTitle,
      selectedCourses.map((c) => c.title),
    );

    if (suggestion) setDescription(suggestion);
    setIsSuggesting(false);
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading learning path…</div>;
  }

  /* =====================
     UI (UNCHANGED)
  ===================== */

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Learning Path Builder
          </h2>
          <p className="text-gray-500">
            Editing path: <span className="font-medium">{pathTitle}</span>
          </p>
        </div>

        <button
          onClick={handleSavePath}
          disabled={saving}
          className="bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? "Saving…" : "Save Path"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium">Path Title</label>
                <input
                  value={pathTitle}
                  onChange={(e) => setPathTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Enrollment Rule</label>
                <select
                  value={enrolmentRule}
                  onChange={(e) => setEnrolmentRule(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">Description</label>
                <button
                  onClick={handleAiDescription}
                  disabled={isSuggesting}
                  className="text-xs text-purple-600 flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  {isSuggesting ? "Generating…" : "AI Write"}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-20 border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Curriculum */}
          <div className="bg-white rounded-xl border flex-1 flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between">
              <h3 className="font-semibold">Curriculum Sequence</h3>
              <span className="text-xs text-gray-500">
                {selectedCourses.length} modules
              </span>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto">
              {selectedCourses.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed rounded-xl">
                  <ArrowRight size={28} />
                  <span className="ml-2">Add courses</span>
                </div>
              ) : (
                selectedCourses.map((course, idx) => (
                  <div
                    key={course.id}
                    className="flex items-center border p-3 rounded-lg"
                  >
                    <GripVertical className="text-gray-400 mr-3" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {idx + 1}. {course.title}
                      </span>
                    </div>
                    <button
                      onClick={() => removeCourse(course.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="col-span-4 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Course Library</h3>
            <input
              type="text"
              placeholder="Filter courses..."
              className="mt-2 w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-brand-primary"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {coursesLoading ? (
              <p className="text-sm text-gray-500 p-3">Loading courses…</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-gray-500 p-3">No courses available</p>
            ) : (
              courses.map((course) => {
                const alreadyAdded = selectedCourses.some(
                  (c) => c.id === course.id,
                );

                return (
                  <div
                    key={course.id}
                    className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <h4
                      className="text-sm font-medium text-gray-800 truncate"
                      title={course.title}
                    >
                      {course.title}
                    </h4>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {course.tags?.[0] ?? "General"}
                      </span>

                      <button
                        onClick={() => addCourse(course)}
                        disabled={alreadyAdded}
                        className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded font-medium hover:bg-brand-primary/10 disabled:opacity-40"
                      >
                        {alreadyAdded ? "Added" : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPaths;
