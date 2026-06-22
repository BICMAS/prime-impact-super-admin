import React from 'react'
import LessonCard from './LessonCard'
import type { Lesson } from '@/types' // adjust the import path based on where your Lesson type is defined


const ModuleCard = React.memo(({ module, onChange }) => {
  const updateLesson = (lesson: Lesson) =>
    onChange({
      ...module,
      lessons: module.lessons.map(l =>
        l.id === lesson.id ? lesson : l
      ),
    });

  return (
    <>
      <input
        value={module.title}
        onChange={e =>
          onChange({ ...module, title: e.target.value })
        }
      />

      {module.lessons.map(lesson => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          onChange={updateLesson}
        />
      ))}
    </>
  );
});
export default ModuleCard;