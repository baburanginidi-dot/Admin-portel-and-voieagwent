
import React, { useState } from 'react';
import { User } from '../types';
import { ArrowLeftIcon, BotIcon } from './icons/Icons';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone) {
      onLogin({ name, phone });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative">
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
        </button>
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
            <BotIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white">Join Voice Agent</h2>
            <p className="text-slate-400">Enter your details to start the conversation.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g., Jane Doe"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g., (555) 123-4567"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!name || !phone}
          >
            Start Call
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
