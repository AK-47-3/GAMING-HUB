import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const StaticPageModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="bg-gray-900/70 border border-purple-400/30 backdrop-blur-xl rounded-2xl p-8 w-full max-w-3xl shadow-2xl shadow-purple-500/10 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-6"> {/* Changed to relative for absolute positioning of X button */}
          <h2 className="text-2xl font-bold text-purple-300 pr-10">{title}</h2> {/* Added pr-10 to prevent title overlapping X button */}
          {/* Smaller X button in the corner */}
          <button onClick={onClose} className="absolute top-0 right-0 bg-black/50 rounded-full p-1 text-gray-300 hover:text-white transition-colors">
            <X size={16} /> {/* Smaller icon size */}
          </button>
        </div>
        <div className="prose prose-invert text-gray-300 max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      </motion.div>
    </motion.div>
  );
};

export default StaticPageModal;
