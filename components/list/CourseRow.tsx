import React from "react";
import { Course } from "@/types";
import { Calendar, Edit2, Eye, FileBox, Layers, Trash2 } from "lucide-react";

interface Props {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
}

const CourseRow: React.FC<Props> = ({ course, onEdit, onDelete }) => {
  const modulesCount = course.modules?.length ?? 0;
  const tags = course.tags ?? [];

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded text-black">
            <FileBox size={20} />
          </div>
          <div>
            <span className="font-medium text-gray-900 block">
              {course.title}
            </span>
            <span className="text-xs text-gray-500">
              v{course.version}
            </span>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Layers size={16} />
          <span>{modulesCount} Modules</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200"
            >
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-xs text-gray-400">
              +{tags.length - 2}
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
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          {course.uploadDate}
        </div>
      </td>

      <td className="px-6 py-4">
        <span className="px-3 py-1 text-xs font-bold rounded-full border">
          {course.status?.toUpperCase()}
        </span>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={onEdit}>
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};


export default CourseRow;
