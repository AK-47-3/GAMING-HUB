import React from 'react';

const InputWithLabel = ({ id, label, ...props }) => (
  <div>
    <label htmlFor={id} className="text-sm font-medium text-cyan-200/80 mb-1 block">{label}</label>
    <input id={id} {...props} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all" />
  </div>
);

export default InputWithLabel;
