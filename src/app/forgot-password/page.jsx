"use client"
import React, { useState } from 'react';
import Header from '../component/Header';
import Footer from '../component/Footer';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setMessage('Password reset link sent to your email!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header handleNavigation={handleNavigation} />
      <main className="flex-1 flex items-center justify-center py-20 bg-gradient-to-b from-green-50 to-white">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold text-center mb-8 text-green-700" style={{ fontFamily: 'Playfair Display, Times New Roman, serif' }}>Forgot Password</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Email</label>
              <input type="email" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {message && <div className="text-green-600 text-sm text-center">{message}</div>}
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200">Send Reset Link</button>
          </form>
          <div className="flex justify-between mt-6 text-sm">
            <button className="text-green-700 hover:underline" onClick={() => handleNavigation('/login')}>Login</button>
            <button className="text-green-700 hover:underline" onClick={() => handleNavigation('/register')}>Register</button>
          </div>
        </div>
      </main>
      <Footer quickLinks={[]} contactInfo={{}} handleNavigation={handleNavigation} />
    </div>
  );
};

export default ForgotPassword;
