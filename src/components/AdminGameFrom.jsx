import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore'; // Import Firestore functions
import InputWithLabel from './InputWithLabel.jsx'; // Import InputWithLabel component

const AdminGameForm = ({ game, onClose, onSave, db, userId, appId, showMessage }) => {
  const [formData, setFormData] = useState(game || { name: "", image: "", price: "", genre: "", htmlContent: "", gameLink: "", approved: false });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
      setFormData(game || { name: "", image: "", price: "", genre: "", htmlContent: "", gameLink: "", approved: false });
  }, [game]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.image || !formData.price || !formData.genre) {
      setError("Game Name, Image URL, Play Fee, and Genre are required.");
      return;
    }
    if (!formData.htmlContent && !formData.gameLink) {
      setError("Either Game HTML Content or Game Link must be provided.");
      return;
    }
    if (!db) { setError("Database not connected."); return; }
    
    setError("");
    setIsSaving(true);
    try {
      if (game && game.id) {
        // Editing existing game
        await updateDoc(doc(db, `artifacts/${appId}/public/data/games`, game.id), formData);
        showMessage("Game updated successfully!", 'success');
      } else {
        // Adding new game
        await addDoc(collection(db, `artifacts/${appId}/public/data/games`), {
          ...formData,
          uploadedBy: userId, // Admin uploads are also tracked by admin's user ID
          timestamp: new Date(),
        });
        showMessage("New game added successfully!", 'success');
      }
      onSave();
    } catch (e) {
      console.error("Error saving game:", e);
      showMessage(`Failed to save game: ${e.message}`, 'error');
      setError("Failed to save game. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 flex-grow mt-6">
      <h3 className="text-2xl font-bold text-cyan-300 mb-4">{game ? 'Edit Game' : 'Add New Game'}</h3>
      {error && <p className="text-red-400 bg-red-500/10 p-2 rounded-md mb-4 text-sm flex items-center gap-2"><AlertCircle size={18} />{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputWithLabel id="name" placeholder="e.g., Cyber Drift" value={formData.name} onChange={handleChange} label="Game Name" />
        <InputWithLabel id="image" placeholder="https://example.com/image.jpg" value={formData.image} onChange={handleChange} label="Image URL (Cover)" />
        <div className="grid grid-cols-2 gap-4">
          <InputWithLabel id="price" placeholder="e.g., $4.99 or Free" value={formData.price} onChange={handleChange} label="Play Fee" />
          <InputWithLabel id="genre" placeholder="e.g., RPG, Shooter" value={formData.genre} onChange={handleChange} label="Genre" />
        </div>
        <div>
            <label htmlFor="htmlContent" className="text-sm font-medium text-cyan-200/80 mb-1 block">Game HTML Content (Optional)</label>
            <textarea id="htmlContent" value={formData.htmlContent} onChange={handleChange} placeholder="Paste your full game HTML code here (including <style> and <script> tags)..." className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all font-mono text-xs"></textarea>
            <p className="text-gray-500 text-xs mt-1">Leave blank if providing an external link.</p>
        </div>
        <div>
            <label htmlFor="gameLink" className="text-sm font-medium text-cyan-200/80 mb-1 block">Game Link (External URL - Optional)</label>
            <input type="url" id="gameLink" value={formData.gameLink} onChange={handleChange} placeholder="https://yourgame.com/play" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" />
            <p className="text-gray-500 text-xs mt-1">Leave blank if providing HTML content. HTML content takes precedence.</p>
        </div>
        <div className="flex items-center mt-4">
          <input type="checkbox" id="approved" checked={formData.approved} onChange={handleChange} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500" />
          <label htmlFor="approved" className="ml-2 text-gray-300 text-sm font-medium">Approve Game (Show on main list)</label>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-grow bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isSaving ? 'Saving...' : 'Save Game'}
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

export default AdminGameForm;
