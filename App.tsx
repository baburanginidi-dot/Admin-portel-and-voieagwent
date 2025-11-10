
import React, { useState } from 'react';
import AdminPortal from './components/AdminPortal';
import UserPortal from './components/UserPortal';
import Login from './components/Login';
import { User } from './types';
import { BotIcon, SettingsIcon } from './components/icons/Icons';

type View = 'home' | 'admin' | 'user';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('user');
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="text-center">
        <BotIcon className="w-24 h-24 text-cyan-400 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Gemini Voice Agent</h1>
        <p className="text-lg text-slate-400 mb-8">Your AI-powered conversational partner.</p>
      </div>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
        <button
          onClick={() => setView('admin')}
          className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-transform transform hover:scale-105"
        >
          <SettingsIcon className="w-6 h-6 mr-2" />
          Admin Portal
        </button>
        <button
          onClick={() => setView('user')}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-transform transform hover:scale-105"
        >
          <BotIcon className="w-6 h-6 mr-2" />
          Launch Voice Agent
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'admin':
        return <AdminPortal onBack={() => setView('home')} />;
      case 'user':
        return user ? <UserPortal user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} onBack={() => setView('home')} />;
      case 'home':
      default:
        return renderHome();
    }
  };

  return <div className="min-h-screen bg-slate-900">{renderContent()}</div>;
};

export default App;
