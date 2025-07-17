import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Edit, Trash2 } from 'lucide-react';

// Import sub-components
import AdminGameForm from './AdminGameForm.jsx';
import AdminStaticPageForm from './AdminStaticPageForm.jsx';

const AdminDashboardModal = ({ 
  isOpen, 
  onClose, 
  onApprove, 
  onDelete, 
  onEdit, 
  onAddGame, 
  onEditStaticPage,
  adminView,
  setAdminView,
  gameToEdit,
  setGameToEdit,
  staticPageToEdit,
  setStaticPageToEdit,
  pendingGames,
  allAdminGames,
  db,
  userId,
  appId,
  showMessage
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="bg-gray-900/70 border border-cyan-400/30 backdrop-blur-xl rounded-2xl p-8 w-full max-w-5xl h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-cyan-300">Admin Dashboard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setAdminView('pending')} className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold ${adminView === 'pending' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Pending Games ({pendingGames.length})</button>
          <button onClick={() => setAdminView('all-games')} className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold ${adminView === 'all-games' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}>All Games ({allAdminGames.length})</button>
          <button onClick={() => { setAdminView('add-game'); setGameToEdit(null); }} className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold ${adminView === 'add-game' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Add New Game</button>
          <button onClick={() => setAdminView('static-pages')} className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold ${adminView === 'static-pages' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Static Pages</button>
        </div>

        {adminView === 'pending' && (
          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">Games Pending Approval</h3>
            {pendingGames.length === 0 ? (
              <p className="text-gray-400">No games pending approval.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingGames.map(game => (
                  <div key={game.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-center gap-4">
                    <img src={game.image} alt={game.name} className="w-24 h-24 object-cover rounded-lg" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/96x96/0D1117/FFFFFF?text=${game.name ? game.name.replace(/\s/g,'+') : 'No+Name'}`}} />
                    <div className="flex-grow">
                      <h4 className="text-xl font-semibold text-white">{game.name}</h4>
                      <p className="text-gray-400 text-sm">Genre: {game.genre}</p>
                      <p className="text-gray-500 text-xs">Uploaded by: {game.uploadedBy}</p>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <button onClick={() => onApprove(game.id)} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full"><CheckCircle size={20} /></button>
                      <button onClick={() => onDelete(game.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminView === 'all-games' && (
          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">All Games (Admin View)</h3>
            {allAdminGames.length === 0 ? (
              <p className="text-gray-400">No games available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allAdminGames.map(game => (
                  <div key={game.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-center gap-4">
                    <img src={game.image} alt={game.name} className="w-24 h-24 object-cover rounded-lg" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/96x96/0D1117/FFFFFF?text=${game.name ? game.name.replace(/\s/g,'+') : 'No+Name'}`}} />
                    <div className="flex-grow">
                      <h4 className="text-xl font-semibold text-white">{game.name} {game.approved ? '' : '(Pending)'}</h4>
                      <p className="text-gray-400 text-sm">Genre: {game.genre}</p>
                      <p className="text-gray-500 text-xs">Uploaded by: {game.uploadedBy}</p>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <button onClick={() => onEdit(game)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"><Edit size={20} /></button>
                      <button onClick={() => onDelete(game.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminView === 'static-pages' && (
          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">Manage Static Pages</h3>
            <div className="space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                <span className="text-white text-lg">Contact Page</span>
                <button onClick={() => onEditStaticPage('contact', 'Contact Page')} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"><Edit size={20} /></button>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                <span className="text-white text-lg">About Page</span>
                <button onClick={() => onEditStaticPage('about', 'About Page')} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"><Edit size={20} /></button>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                <span className="text-white text-lg">How To Use Page</span>
                <button onClick={() => onEditStaticPage('howToUse', 'How To Use Page')} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"><Edit size={20} /></button>
              </div>
            </div>
          </div>
        )}

        {(adminView === 'add-game' || adminView === 'edit-game') && (
          <AdminGameForm 
            game={gameToEdit} 
            onClose={() => { setAdminView('all-games'); setGameToEdit(null); }} 
            onSave={() => { setAdminView('all-games'); setGameToEdit(null); }} 
            db={db}
            userId={userId}
            appId={appId}
            showMessage={showMessage}
          />
        )}

        {adminView === 'edit-static-page' && staticPageToEdit && (
          <AdminStaticPageForm
            page={staticPageToEdit}
            onClose={() => { setAdminView('static-pages'); setStaticPageToEdit(null); }}
            onSave={() => { setAdminView('static-pages'); setStaticPageToEdit(null); }}
            db={db}
            appId={appId}
            showMessage={showMessage}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboardModal;
