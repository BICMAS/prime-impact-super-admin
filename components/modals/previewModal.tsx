import * as React from 'react';
import { X, Play, Box } from 'lucide-react';

interface Props {
  isOpen: boolean;
  lessonTitle: string;
  fileName: string;
  onClose: () => void;
}

const PreviewModal: React.FC<Props> = ({
  isOpen,
  lessonTitle,
  fileName,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full h-full md:w-[90vw] md:h-[90vh] md:rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-brand-primary p-2 rounded-lg">
              <Box size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {lessonTitle}
              </h3>
              <p className="text-xs text-slate-400">
                SCORM Preview • {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-lg">
            <Play size={48} className="text-brand-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {lessonTitle}
            </h2>
            <p className="text-gray-500">
              SCORM content from <code>{fileName}</code> would
              render here in production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
