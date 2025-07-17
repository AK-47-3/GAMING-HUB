import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

const ADMIN_PASSWORD = "ADMIN_ORIONEX"; // Admin password defined here for direct use

const AdminLoginModal = ({ isOpen, onClose, onLogin, showMessage }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLogin(password);
      setPassword('');
      setError('');
    } else {
      setError("Incorrect password.");
      showMessage("Incorrect admin password.", 'error');
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
        className="bg-gray-900/70 border border-purple-400/30 backdrop-blur-xl rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-purple-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-300">Admin Login</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        {error && <p className="text-red-400 bg-red-500/10 p-2 rounded-md mb-4 text-sm flex items-center gap-2"><AlertCircle size={18} />{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminPassword" className="block text-gray-300 text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              id="adminPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50 transition duration-200"
              placeholder="Enter admin password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition duration-300 shadow-md transform hover:scale-105"
          >
            Login
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AdminLoginModal;
