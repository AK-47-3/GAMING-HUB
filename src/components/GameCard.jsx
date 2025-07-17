import React from 'react';
import { motion } from 'framer-motion';

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
    </motion.div>
  );
};

export default GameCard;
