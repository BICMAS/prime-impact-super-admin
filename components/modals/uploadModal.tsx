import * as React from 'react';
import { Upload, X, Box } from 'lucide-react';

interface Props {
  isOpen: boolean;
  file: File | null;
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const UploadModal: React.FC<Props> = ({
  isOpen,
  file,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
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
            onClick={onCancel}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4 bg-brand-primary/10 p-4 rounded-lg border border-brand-primary/20">
            <div className="bg-brand-primary/10 p-3 rounded-lg text-brand-primary">
              <Box size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {file.name}
              </p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lesson Title
            </label>
            <input
              value={title}
              onChange={e => onTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => onDescriptionChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!title}
            className="px-6 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-dark disabled:opacity-50 flex items-center gap-2"
          >
            <Upload size={16} /> Save & Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
