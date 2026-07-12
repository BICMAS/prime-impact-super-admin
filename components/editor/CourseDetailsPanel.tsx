import React from 'react'
import {
  FileBox,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Course } from '@/types';
import { generateCourseTags } from '@/services/geminiService';
import { useState } from 'react';

interface Props {
  course: Course;
  onUpdate: <K extends keyof Course>(key: K, value: Course[K]) => void;
}

const CourseDetailsPanel: React.FC<Props> = ({ course, onUpdate }) => {
  const [generatingTags, setGeneratingTags] = useState(false);

  const handleGenerateTags = async () => {
    if (!course.title) return;

    setGeneratingTags(true);
    const tags = await generateCourseTags(
      course.title,
      course.description || ''
    );
    onUpdate('tags', tags);
    setGeneratingTags(false);
  };

  return (
    <div className="col-span-12 lg:col-span-4 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileBox size={18} className="text-brand-primary" />
          Course Details
        </h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title
            </label>
            <input
              type="text"
              value={course.title}
              onChange={e => onUpdate('title', e.target.value)}
              placeholder="e.g. Fire Safety 101"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={course.description || ''}
              onChange={e => onUpdate('description', e.target.value)}
              placeholder="Brief summary of the course..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none h-32 text-sm resize-none"
            />
          </div>

          {/* Version & Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                type="text"
                value={course.version}
                onChange={e => onUpdate('version', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={course.visibility}
                onChange={e =>
                  onUpdate(
                    'visibility',
                    e.target.value as Course['visibility']
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
              >
                <option value="Internal">Internal</option>
                <option value="External">External</option>
                <option value="Department">Department</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
              <span>Tags</span>
              <button
                onClick={handleGenerateTags}
                disabled={generatingTags || !course.title}
                className="text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded inline-flex items-center transition-colors disabled:opacity-50"
              >
                {generatingTags ? (
                  <Loader2
                    size={12}
                    className="animate-spin mr-1"
                  />
                ) : (
                  <Sparkles size={12} className="mr-1" />
                )}
                {generatingTags ? 'Generating...' : 'AI Suggest'}
              </button>
            </label>

            <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[50px] bg-gray-50/50">
              {course.tags.length > 0 ? (
                course.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs flex items-center shadow-sm"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        onUpdate(
                          'tags',
                          course.tags.filter(t => t !== tag)
                        )
                      }
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm italic px-1">
                  No tags added
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPanel;
