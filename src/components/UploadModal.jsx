import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, Upload } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore'; // Import Firestore functions
import InputWithLabel from './InputWithLabel.jsx'; // Import InputWithLabel component

const UploadModal = ({ isOpen, onClose, db, userId, appId, showMessage }) => {
  const [newGame, setNewGame] = useState({ name: "", image: "", price: "", genre: "", htmlContent: "", gameLink: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!newGame.name || !newGame.image || !newGame.price || !newGame.genre) {
      setError("Game Name, Image URL, Play Fee, and Genre are required.");
      return;
    }
    if (!newGame.htmlContent && !newGame.gameLink) {
      setError("Either Game HTML Content or Game Link must be provided.");
      return;
    }
    if (!db || !userId) { 
      setError("Database not connected or user not authenticated."); 
      return; 
    }
    setError("");
    setIsUploading(true);
    try {
      const gamesCollectionPath = `/artifacts/${appId}/public/data/games`;
      await addDoc(collection(db, gamesCollectionPath), {
          ...newGame,
          uploadedBy: userId, // Store who uploaded the game
          timestamp: new Date(), // Add a timestamp
          approved: false, // New games need approval by default
      });
      setNewGame({ name: "", image: "", price: "", genre: "", htmlContent: "", gameLink: "" });
      showMessage("Game uploaded successfully! Awaiting admin approval.", 'success');
      onClose();
    } catch (e) {
      console.error("Error adding document: ", e);
      showMessage(`Failed to upload game: ${e.message}`, 'error');
      setError("Failed to upload game. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="bg-gray-900/70 border border-cyan-400/30 backdrop-blur-xl rounded-2xl p-8 w-full max-w-lg shadow-2xl shadow-cyan-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-300">🎮 Upload Your Game</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        {error && <p className="text-red-400 bg-red-500/10 p-2 rounded-md mb-4 text-sm flex items-center gap-2"><AlertCircle size={18} />{error}</p>}
        <div className="space-y-4">
          <InputWithLabel id="name" placeholder="e.g., Cyber Drift" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} label="Game Name" />
          <InputWithLabel id="image" placeholder="https://example.com/image.jpg" value={newGame.image} onChange={(e) => setNewGame({ ...newGame, image: e.target.value })} label="Image URL (Cover)" />
          <div className="grid grid-cols-2 gap-4">
            <InputWithLabel id="price" placeholder="e.g., $4.99 or Free" value={newGame.price} onChange={(e) => setNewGame({ ...newGame, price: e.target.value })} label="Play Fee" />
            <InputWithLabel id="genre" placeholder="e.g., RPG, Shooter" value={newGame.genre} onChange={(e) => setNewGame({ ...newGame, genre: e.target.value })} label="Genre" />
          </div>
          <div>
              <label htmlFor="htmlContent" className="text-sm font-medium text-cyan-200/80 mb-1 block">Game HTML Content (Optional)</label>
              <textarea id="htmlContent" value={newGame.htmlContent} onChange={(e) => setNewGame({ ...newGame, htmlContent: e.target.value })} placeholder="Paste your full game HTML code here (including <style> and <script> tags)..." className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all font-mono text-xs"></textarea>
              <p className="text-gray-500 text-xs mt-1">Leave blank if providing an external link.</p>
          </div>
          <div>
              <label htmlFor="gameLink" className="text-sm font-medium text-cyan-200/80 mb-1 block">Game Link (External URL - Optional)</label>
              <input type="url" id="gameLink" value={newGame.gameLink} onChange={(e) => setNewGame({ ...newGame, gameLink: e.target.value })} placeholder="https://yourgame.com/play" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" />
              <p className="text-gray-500 text-xs mt-1">Leave blank if providing HTML content. HTML content takes precedence.</p>
          </div>
        </div>
        <button onClick={handleUpload} disabled={isUploading} className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-105">
          <Upload size={18} />
          {isUploading ? "Uploading..." : "Upload & Share"}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default UploadModal;
