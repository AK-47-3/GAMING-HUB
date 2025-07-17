import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, doc, deleteDoc, updateDoc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { Search, Upload, Star, Sparkles, AlertCircle, Lock, MoreVertical, Mail, Info, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Component Imports
// নিশ্চিত করুন যে এই ফাইলগুলো src/components/ ফোল্ডারের ভিতরে আছে
import GameCard from './components/GameCard.jsx';
import UploadModal from './components/UploadModal.jsx';
import AdminLoginModal from './components/AdminLoginModal.jsx';
import AdminDashboardModal from './components/AdminDashboardModal.jsx';
import AdminGameForm from './components/AdminGameForm.jsx';
import AdminStaticPageForm from './components/AdminStaticPageForm.jsx';
import StaticPageModal from './components/StaticPageModal.jsx';
// InputWithLabel is used directly inside forms, so it's not explicitly imported here for main App.js render

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
  const [selectedGame, setSelectedGame] = null; // Changed to null as initial state
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
                                className="flex-shrink-0 w-80 h-48 rounded-xl overflow-hidden cursor-pointer group relative shadow-lg border border-white/10 hover:border-purple-400/60 transition-all"
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
                [...Array(8)].map((_, i) => <div key={i} className="rounded-2xl p-4 bg-white/5 animate-pulse">
                  <div className="w-full h-40 bg-white/10 rounded-lg mb-4"></div>
                  <div className="h-6 w-3/4 bg-white/10 rounded mb-2"></div>
                  <div className="h-4 w-1/4 bg-white/10 rounded"></div>
                </div>)
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
        {isUploadModalOpen && <UploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} db={db} userId={userId} appId={appId} showMessage={showMessage} />}
        {selectedGame && <GameDetailModal game={selectedGame} onClose={() => setSelectedGame(null)} />}
        {showAdminLogin && <AdminLoginModal isOpen={showAdminLogin} onClose={() => setShowAdminLogin(false)} onLogin={handleAdminLogin} showMessage={showMessage} />}
        {isAdminLoggedIn && (
          <AdminDashboardModal 
            isOpen={isAdminLoggedIn} 
            onClose={() => setIsAdminLoggedIn(false)} 
            onApprove={handleApproveGame}
            onDelete={handleAdminDeleteGame} 
            onEdit={handleEditGame}
            onAddGame={() => { setAdminView('add-game'); setGameToEdit(null); }}
            onEditStaticPage={handleEditStaticPage}
            adminView={adminView}
            setAdminView={setAdminView}
            gameToEdit={gameToEdit}
            setGameToEdit={setGameToEdit}
            staticPageToEdit={staticPageToEdit}
            setStaticPageToEdit={setStaticPageToEdit}
            pendingGames={pendingGames}
            allAdminGames={allAdminGames}
            db={db}
            userId={userId}
            appId={appId}
            showMessage={showMessage}
          />
        )}
        {showStaticPageModal && <StaticPageModal isOpen={showStaticPageModal} onClose={() => setShowStaticPageModal(false)} title={staticPageTitle} content={staticPageContent} />}
      </AnimatePresence>
    </div>
  );
}
