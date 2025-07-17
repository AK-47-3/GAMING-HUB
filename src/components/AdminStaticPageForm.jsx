import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions

const AdminStaticPageForm = ({ page, onClose, onSave, db, appId, showMessage }) => {
  const [content, setContent] = useState(page.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setContent(page.content);
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db) { setError("Database not connected."); return; }
    
    setError("");
    setIsSaving(true);
    try {
      const docRef = doc(db, `artifacts/${appId}/public/data/staticPages`, page.id);
      await setDoc(docRef, { content: content }, { merge: true }); // Use setDoc with merge to create/update
      showMessage(`${page.title} updated successfully!`, 'success');
      onSave();
    } catch (e) {
      console.error(`Error saving ${page.title}:`, e);
      showMessage(`Failed to save ${page.title}: ${e.message}`, 'error');
      setError(`Failed to save ${page.title}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 flex-grow mt-6">
      <h3 className="text-2xl font-bold text-cyan-300 mb-4">Edit {page.title}</h3>
      {error && <p className="text-red-400 bg-red-500/10 p-2 rounded-md mb-4 text-sm flex items-center gap-2"><AlertCircle size={18} />{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pageContent" className="text-sm font-medium text-cyan-200/80 mb-1 block">Content (HTML/Text)</label>
          <textarea id="pageContent" value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Enter content for ${page.title}...`} className="w-full h-64 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all font-mono text-xs"></textarea>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-grow bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isSaving ? 'Saving...' : 'Save Content'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 transition duration-300 transform hover:scale-105"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminStaticPageForm;
