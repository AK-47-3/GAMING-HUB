import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // যদি আপনার প্রজেক্টে এই ফাইলটি থাকে, তাহলে এটি আপনার গ্লোবাল CSS লোড করবে।
import App from './App'; // আপনার App.js ফাইল থেকে 'App' কম্পোনেন্টটি ইম্পোর্ট করা হচ্ছে।
import reportWebVitals from './reportWebVitals'; // অ্যাপের পারফরম্যান্স পরিমাপের জন্য, যদি প্রয়োজন হয়।

// React 18+ এর জন্য রুট তৈরি করা হচ্ছে।
// এটি HTML ফাইলের <div id="root"> এলিমেন্টটিকে খুঁজে বের করে।
const root = ReactDOM.createRoot(document.getElementById('root'));

// আপনার অ্যাপ কম্পোনেন্টটিকে রুট এলিমেন্টের মধ্যে রেন্ডার করা হচ্ছে।
root.render(
  <React.StrictMode>
    <App /> {/* আপনার প্রধান অ্যাপ্লিকেশন কম্পোনেন্টটি এখানে প্রদর্শিত হবে। */}
  </React.StrictMode>
);

// ওয়েব ভাইটালস রিপোর্টিং সেটআপ করা হচ্ছে।
// এটি আপনার ওয়েবসাইটের পারফরম্যান্স ট্র্যাক করতে সাহায্য করে।
reportWebVitals();
