import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { Search, Upload, Gamepad2, X, Star, Sparkles, AlertCircle, ExternalLink, Lock, MoreVertical, CheckCircle, Edit, Trash2, Info, Mail, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase outside of the component to avoid re-initialization
let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// --- Google Analytics Configuration ---
const GA_TRACKING_ID = 'G-LJBG788P2Q'; // Your Google Analytics Measurement ID

// --- Admin Password (Hardcoded for demo purposes) ---
const ADMIN_PASSWORD = "ADMIN_ORIONEX";

// --- Main App Component ---
export default function FuturisticGamingSiteV3() {
  // --- State Management ---
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false); // New state for admin login

  const [gameList, setGameList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [message, setMessage] = useState(''); // For custom messages/alerts
  const [showAdminLogin, setShowAdminLogin] = useState(false); // State for admin login modal
  const [adminView, setAdminView] = useState('pending'); // 'pending', 'all-games', 'add-game', 'edit-game', 'static-pages', 'edit-static-page'
  const [gameToEdit, setGameToEdit] = useState(null); // Game data for editing
  const [showMainMenu, setShowMainMenu] = useState(false); // State for the 3-dot menu dropdown
  const [showStaticPageModal, setShowStaticPageModal] = useState(false);
  const [staticPageContent, setStaticPageContent] = useState('');
  const [staticPageTitle, setStaticPageTitle] = useState('');
  const [staticPageToEdit, setStaticPageToEdit] = useState(null); // Static page data for editing

  // --- Firebase Initialization & Auth ---
  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized.");
      setIsAuthReady(true); 
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        console.log("User signed in:", user.uid);
      } else {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Signed in with custom token.");
          } else {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
          }
        } catch (authError) {
          console.error("Authentication failed:", authError);
          showMessage(`Authentication failed: ${authError.message}`, 'error');
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Google Analytics Integration ---
  useEffect(() => {
    if (GA_TRACKING_ID && GA_TRACKING_ID !== 'YOUR_GA_MEASUREMENT_ID') {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', GA_TRACKING_ID);

      console.log('Google Analytics initialized with ID:', GA_TRACKING_ID);

      return () => {
        document.head.removeChild(script);
      };
    } else {
      console.warn("Google Analytics Tracking ID is not set. Please replace 'YOUR_GA_MEASUREMENT_ID' with your actual ID.");
    }
  }, []);

  // --- Firestore Data Fetching ---
  useEffect(() => {
    if (!isAuthReady || !db) return;
    
    setIsLoading(true);
    const gamesCollectionPath = `/artifacts/${appId}/public/data/games`;
    const q = query(collection(db, gamesCollectionPath));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const gamesData = [];
      querySnapshot.forEach((doc) => {
        gamesData.push({ id: doc.id, ...doc.data() });
      });
      setGameList(gamesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching games:", error);
      showMessage(`Error fetching games: ${error.message}`, 'error');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, db]);

  // --- Utility for showing messages ---
  const showMessage = (msg, type = 'info', duration = 3000) => {
    setMessage({ text: msg, type: type });
    setTimeout(() => setMessage(''), duration);
  };

  // --- Derived State & Data ---
  const genres = useMemo(() => ['All', ...new Set(gameList.map(g => g.genre).filter(Boolean))], [gameList]);
  const featuredGames = useMemo(() => gameList.filter(game => game.approved).slice().sort(() => 0.5 - Math.random()).slice(0, 5), [gameList]);

  // Filter games for main display (only approved games)
  const filteredGames = useMemo(() => {
    return gameList.filter(game => {
      const gameName = game.name ? game.name.toLowerCase() : '';
      const matchesSearch = gameName.includes(searchTerm.toLowerCase());
      const matchesGenre = activeGenre === 'All' || game.genre === activeGenre;
      return matchesSearch && matchesGenre && game.approved; // Only show approved games
    });
  }, [gameList, searchTerm, activeGenre]);

  // Games for admin panel (all games, regardless of approval status)
  const pendingGames = useMemo(() => gameList.filter(game => !game.approved), [gameList]);
  const allAdminGames = useMemo(() => gameList, [gameList]); // All games for admin view

  // --- Handle Game Deletion (for users - now removed) ---
  // This function is no longer passed to GameCard, as user deletion is removed.
  // Kept here for context if needed for other admin-like roles in future.
  const handleUserDeleteGame = async (gameId, uploadedBy) => {
    // This function is deprecated for user-facing delete.
    // Admin panel handles all deletions.
  };

  // --- Admin Panel Functions ---
  const handleAdminLogin = (password) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
      showMessage("Admin login successful!", 'success');
    } else {
      showMessage("Incorrect admin password.", 'error');
    }
  };

  const handleApproveGame = async (gameId) => {
    if (!db) return;
    try {
      setIsLoading(true);
      await updateDoc(doc(db, `artifacts/${appId}/public/data/games`, gameId), {
        approved: true,
      });
      showMessage("Game approved successfully!", 'success');
    } catch (error) {
      console.error("Error approving game:", error);
      showMessage(`Error approving game: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminDeleteGame = async (gameId) => {
    if (!db) return;
    const confirmDeletion = prompt("Are you sure you want to DELETE this game from Admin Panel? Type 'confirm' to proceed.");
    if (confirmDeletion && confirmDeletion.toLowerCase() === 'confirm') {
      try {
        setIsLoading(true);
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/games`, gameId));
        showMessage("Game deleted by admin!", 'success');
      } catch (error) {
        console.error("Error deleting game (admin):", error);
        showMessage(`Error deleting game: ${error.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      showMessage("Admin deletion cancelled.", 'info');
    }
  };

  const handleEditGame = (game) => {
    setGameToEdit(game);
    setAdminView('edit-game');
  };

  const fetchStaticPageContent = async (pageId, title) => {
    if (!db) return;
    try {
      const docRef = doc(db, `artifacts/${appId}/public/data/staticPages`, pageId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStaticPageContent(docSnap.data().content || "No content available yet.");
      } else {
        setStaticPageContent("No content available yet. Admin can add it from the Admin Panel.");
      }
      setStaticPageTitle(title);
      setShowStaticPageModal(true);
    } catch (error) {
      console.error(`Error fetching ${pageId} content:`, error);
      showMessage(`Error fetching ${title} content.`, 'error');
      setStaticPageContent("Error loading content.");
      setStaticPageTitle(title);
      setShowStaticPageModal(true);
    }
  };

  const handleEditStaticPage = async (pageId, title) => {
    if (!db) return;
    try {
      const docRef = doc(db, `artifacts/${appId}/public/data/staticPages`, pageId);
      const docSnap = await getDoc(docRef);
      setStaticPageToEdit({
        id: pageId,
        title: title,
        content: docSnap.exists() ? docSnap.data().content : "",
      });
      setAdminView('edit-static-page');
    } catch (error) {
      console.error(`Error fetching static page for edit:`, error);
      showMessage(`Error loading ${title} for editing.`, 'error');
    }
  };

  // --- Render Helper Components ---
  const GameCard = ({ game, onCardClick }) => {
    return (
      <motion.div
        layout
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ type: 'spring', stiffness: 100, damping: 10 }}
        whileHover={{ scale: 1.05, y: -8 }}
        onClick={() => onCardClick(game)}
        className="group relative rounded-2xl overflow-hidden shadow-lg bg-black/40 backdrop-blur-lg border border-white/10 transition-all duration-300 hover:border-cyan-400/60 hover:shadow-cyan-400/20 cursor-pointer"
      >
        <img 
          src={game.image} 
          alt={game.name} 
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/0D1117/FFFFFF?text=${game.name ? game.name.replace(/\s/g,'+') : 'No+Name'}`}}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <h2 className="text-xl font-bold text-white drop-shadow-lg truncate">{game.name}</h2>
          <div className="flex justify-between items-center mt-2">
              <p className="text-sm font-semibold text-cyan-300 bg-black/50 px-2 py-1 rounded-full inline-block">
                {game.price}
              </p>
              <p className="text-xs font-semibold text-purple-300 bg-black/50 px-2 py-1 rounded-full inline-block">
                {game.genre}
              </p>
          </div>
        </div>
        {/* User-facing delete button removed as per request */}
      </motion.div>
    );
  };

  const SkeletonCard = () => (
    <div className="rounded-2xl p-4 bg-white/5 animate-pulse">
      <div className="w-full h-40 bg-white/10 rounded-lg mb-4"></div>
      <div className="h-6 w-3/4 bg-white/10 rounded mb-2"></div>
      <div className="h-4 w-1/4 bg-white/10 rounded"></div>
    </div>
  );

  const AdminLoginModal = ({ isOpen, onClose, onLogin }) => {
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

  const AdminDashboardModal = ({ isOpen, onClose, onApprove, onDelete, onEdit, onAddGame, onEditStaticPage }) => {
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
            />
          )}

          {adminView === 'edit-static-page' && staticPageToEdit && (
            <AdminStaticPageForm
              page={staticPageToEdit}
              onClose={() => { setAdminView('static-pages'); setStaticPageToEdit(null); }}
              onSave={() => { setAdminView('static-pages'); setStaticPageToEdit(null); }}
            />
          )}
        </motion.div>
      </motion.div>
    );
  };

  const AdminGameForm = ({ game, onClose, onSave }) => {
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

  const AdminStaticPageForm = ({ page, onClose, onSave }) => {
    const [content, setContent] = useState(page.content);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

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

  const UploadModal = ({ isOpen, onClose }) => {
    const [newGame, setNewGame] = useState({ name: "", image: "", price: "", genre: "", htmlContent: "", gameLink: "" });
    // Removed uploadPassword state and input as per request
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
      // Removed password validation as per request
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
            {/* Removed upload password as per request */}
          </div>
          <button onClick={handleUpload} disabled={isUploading} className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-105">
            <Upload size={18} />
            {isUploading ? "Uploading..." : "Upload & Share"}
          </button>
        </motion.div>
      </motion.div>
    );
  };
  
  const GameDetailModal = ({ game, onClose }) => {
    if (!game) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative bg-gray-900/70 border border-purple-500/30 backdrop-blur-xl rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 right-0 p-4 z-10">
                    <button onClick={onClose} className="bg-black/50 rounded-full p-2 text-gray-300 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Game Title and Info */}
                <div className="p-6 bg-gray-800/50 border-b border-gray-700">
                    <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 mb-2">{game.name}</h2>
                    <div className="flex gap-4 items-center">
                        <span className="text-lg font-semibold text-cyan-300">{game.price}</span>
                        <span className="text-sm font-semibold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full">{game.genre}</span>
                        {game.uploadedBy && <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">Uploaded by: {game.uploadedBy}</span>}
                        {game.approved === false && <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">Pending Approval</span>}
                    </div>
                </div>

                {/* Game Play Area (iframe or external link button) */}
                <div className="flex-grow w-full bg-black/70 p-2 flex items-center justify-center">
                    {game.htmlContent ? (
                        <iframe
                            srcDoc={game.htmlContent}
                            title={game.name}
                            className="w-full h-full border-none rounded-lg"
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Essential for security
                        ></iframe>
                    ) : game.gameLink ? (
                        <div className="text-center">
                            <p className="text-gray-300 text-lg mb-4">This game is hosted externally.</p>
                            <a href={game.gameLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105">
                                <ExternalLink size={20} /> Play External Game
                            </a>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                            <AlertCircle className="mr-2" /> No playable content or link available for this game.
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
  }

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

  const InputWithLabel = ({ id, label, ...props }) => (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-cyan-200/80 mb-1 block">{label}</label>
      <input id={id} {...props} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" />
    </div>
  );

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[#0D1117] text-white font-sans">
      {/* The 3D background has been temporarily disabled to resolve a rendering error.
        It can be re-enabled by uncommenting the block below if the environment issue is resolved.
      */}
      {/*
      <div className="fixed inset-0 -z-10">
        <Suspense fallback={null}>
          <Canvas><Stars /></Canvas>
        </Suspense>
      </div>
      */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[#0D1117] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-cyan-400 opacity-20 blur-[100px]"></div>
      </div>

      {/* Custom Message/Alert Display */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2
              ${message.type === 'success' ? 'bg-green-600 text-white' :
                message.type === 'error' ? 'bg-red-600 text-white' :
                message.type === 'warning' ? 'bg-yellow-600 text-white' :
                'bg-blue-600 text-white'
              }`}
          >
            {message.type === 'error' && <AlertCircle size={20} />}
            {message.type === 'success' && <Sparkles size={20} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Main Menu Button */}
        <div className="absolute top-4 left-4 z-30">
          <button onClick={() => setShowMainMenu(!showMainMenu)} className="bg-gray-800/70 p-3 rounded-full text-gray-300 hover:text-white hover:bg-gray-700/80 transition-all duration-200 shadow-lg">
            <MoreVertical size={24} />
          </button>
          <AnimatePresence>
            {showMainMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-14 left-0 bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 py-2 w-48"
              >
                <button onClick={() => { setShowAdminLogin(true); setShowMainMenu(false); }} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700/50">
                  <Lock size={18} /> Admin Panel
                </button>
                <button onClick={() => { fetchStaticPageContent('contact', 'Contact'); setShowMainMenu(false); }} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700/50">
                  <Mail size={18} /> Contact
                </button>
                <button onClick={() => { fetchStaticPageContent('about', 'About Us'); setShowMainMenu(false); }} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700/50">
                  <Info size={18} /> About Us
                </button>
                <button onClick={() => { fetchStaticPageContent('howToUse', 'HowToUse'); setShowMainMenu(false); }} className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700/50">
                  <BookOpen size={18} /> How To Use
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <header className="text-center py-8 md:py-12">
          <motion.h1 
            initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 mb-4"
          >
            Cosmic Game Hub
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Discover, play, and share indie games from across the universe. Your next adventure awaits.
          </motion.p>
          {userId && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-gray-500 mt-4 text-sm"
            >
              Your User ID: <span className="font-mono text-gray-400 break-all">{userId}</span>
            </motion.p>
          )}
        </header>
        
        {/* Featured Games Carousel */}
        {!isLoading && featuredGames.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-12">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-purple-300 mb-4"><Star /> Featured Games</h2>
                <div className="relative">
                    <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
                        {featuredGames.map(game => (
                             <motion.div key={game.id} onClick={() => setSelectedGame(game)}
                                className="flex-shrink-0 w-80 h-48 rounded-xl overflow-hidden cursor-pointer group relative shadow-lg bg-black/40 backdrop-blur-lg border border-white/10 hover:border-purple-400/60 transition-all"
                                whileHover={{ scale: 1.02, y: -5 }}>
                                <img src={game.image} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/320x192/0D1117/FFFFFF?text=${game.name ? game.name.replace(/\s/g,'+') : 'No+Name'}`}} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-4">
                                    <h3 className="font-bold text-lg text-white">{game.name}</h3>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        )}

        {/* --- Controls: Search, Filter, Upload --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="sticky top-4 z-20 p-4 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              {/* Search input: This field filters games live as you type. No separate search button is needed. */}
              <input type="text" placeholder="Search games..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border border-transparent rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"/>
            </div>
            <button onClick={() => setUploadModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105">
              <Upload size={18} /> Upload
            </button>
          </div>
          {!isLoading && genres.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
                {genres.map(genre => (
                    <button key={genre} onClick={() => setActiveGenre(genre)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 border ${activeGenre === genre ? 'bg-cyan-400/20 border-cyan-400 text-cyan-300' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                        {genre}
                    </button>
                ))}
            </div>
          )}
        </motion.div>

        {/* --- Game Grid --- */}
        <main>
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {isLoading ? (
                [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
              ) : filteredGames.length > 0 ? (
                  filteredGames.map((game) => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      onCardClick={setSelectedGame} 
                    />
                  ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-20 bg-black/20 rounded-2xl col-span-full">
                  <Sparkles size={48} className="mx-auto text-gray-500 mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-300">No Approved Games Found</h3>
                  <p className="text-gray-500 mt-2">Try uploading a game or check back later for new approvals.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
      
      {/* --- Modals --- */}
      <AnimatePresence>
        {isUploadModalOpen && <UploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} />}
        {selectedGame && <GameDetailModal game={selectedGame} onClose={() => setSelectedGame(null)} />}
        {showAdminLogin && <AdminLoginModal isOpen={showAdminLogin} onClose={() => setShowAdminLogin(false)} onLogin={handleAdminLogin} />}
        {isAdminLoggedIn && (
          <AdminDashboardModal 
            isOpen={isAdminLoggedIn} 
            onClose={() => setIsAdminLoggedIn(false)} 
            onApprove={handleApproveGame}
            onDelete={handleAdminDeleteGame} // Admin delete doesn't require ORIONEX password
            onEdit={handleEditGame}
            onAddGame={() => { setAdminView('add-game'); setGameToEdit(null); }}
            onEditStaticPage={handleEditStaticPage}
          />
        )}
        {showStaticPageModal && <StaticPageModal isOpen={showStaticPageModal} onClose={() => setShowStaticPageModal(false)} title={staticPageTitle} content={staticPageContent} />}
      </AnimatePresence>
    </div>
  );
}

