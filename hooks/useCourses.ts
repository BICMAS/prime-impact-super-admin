import { useEffect, useState } from "react";
import { Course } from "@/types";
import { fetchCourses } from "@/services/courseApi";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
  fetchCourses().then(res => {
    const normalized = Array.isArray(res)
      ? res
      : res.data ?? [];

    setCourses(normalized);
  });
}, []);

console.log('COURSES STATE:', courses);


  const upsertCourse = (course: Course) => {
    setCourses(prev =>
      prev.some(c => c.id === course.id)
        ? prev.map(c => (c.id === course.id ? course : c))
        : [course, ...prev]
    );
  };

  const removeCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  return { courses, upsertCourse, removeCourse };
}
