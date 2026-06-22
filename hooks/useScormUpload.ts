import { uploadScorm } from "@/services/courseApi";
import { Lesson } from "@/types";



export function useScormUpload(onUploaded: (lesson: Lesson) => void) {
  const upload = async (payload: {
    file: File;
    courseId: string;
    moduleId: string;
    lessonId: string;
    title: string;
    description?: string;
  }) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) =>
      formData.append(k, v as any)
    );

    const response = await uploadScorm(formData);
    onUploaded(response);
  };

  return { upload };
}
