import React from 'react'
import { Course, Lesson, Module } from '@/types';
import ModuleCard from './ModuleCard';

interface Props {
  course: Course;
  onUpdate: <K extends keyof Course>(key: K, value: Course[K]) => void;
  onUpload: (moduleId: string, lessonId: string) => void;
  onPreview: (lesson: Lesson) => void;
}

const CurriculumBuilder: React.FC<Props> = ({
  course,
  onUpdate,
  onUpload,
  onPreview,
}) => {
  const updateModules = (modules: Module[]) =>
    onUpdate('modules', modules);

  return (
    <div className="col-span-12 lg:col-span-8 space-y-6">
      {course.modules.map(module => (
        <ModuleCard
          key={module.id}
          module={module}
          onChange={updated =>
            updateModules(
              course.modules.map(m =>
                m.id === updated.id ? updated : m
              )
            )
          }
          onUpload={onUpload}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
};

export default CurriculumBuilder;
