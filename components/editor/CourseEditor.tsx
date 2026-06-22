import React from 'react'

import { Course, Lesson } from '@/types';
import CourseDetailsPanel from './CourseDetailsPanel';
import CurriculumBuilder from './CurriculumBuilder';

interface Props {
  course: Course;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  onBack: () => void;
  onUpdate: <K extends keyof Course>(key: K, value: Course[K]) => void;
  onUpload: (moduleId: string, lessonId: string) => void;
  onPreview: (lesson: Lesson) => void;
}

const CourseEditor: React.FC<Props> = ({
  course,
  onSave,
  onPublish,
  onBack,
  onUpdate,
  onUpload,
  onPreview,
}) => (
  <>
    <header className="flex items-center justify-between">
      <button onClick={onBack}>Back</button>
      <div className="flex gap-2">
        <button onClick={onPublish}>Publish</button>
        <button onClick={onSave}>Save</button>
      </div>
    </header>

    <div className="grid grid-cols-12 gap-6">
      <CourseDetailsPanel course={course} onUpdate={onUpdate} />
      <CurriculumBuilder
        course={course}
        onUpdate={onUpdate}
        onUpload={onUpload}
        onPreview={onPreview}
      />
    </div>
  </>
);

export default CourseEditor;
