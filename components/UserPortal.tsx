
import React, { useState, useEffect, useRef } from 'react';
import { User, TranscriptMessage } from '../types';
import { startSession, closeSession } from '../services/geminiService';
import { BotIcon, PhoneIcon, UserIcon, MicIcon, MicOffIcon } from './icons/Icons';

interface UserPortalProps {
  user: User;
  onLogout: () => void;
}

type CallStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

const UserPortal: React.FC<UserPortalProps> = ({ user, onLogout }) => {
  const [status, setStatus] = useState<CallStatus>('CONNECTING');
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptMessage[]>([]);
  const [currentUserTranscription, setCurrentUserTranscription] = useState('');
  const [currentAgentTranscription, setCurrentAgentTranscription] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sessionClosed = false;
    
    const handleConnect = () => {
        if (!sessionClosed) setStatus('CONNECTED');
    };
    
    const handleDisconnect = () => {
        if (!sessionClosed) setStatus('DISCONNECTED');
    };
    
    const handleError = (error: any) => {
        console.error('Session error:', error);
        if (!sessionClosed) setStatus('ERROR');
    };

    const handleTranscriptionUpdate = (update: { user: string; agent: string; isFinal: boolean }) => {
        if(sessionClosed) return;

        setCurrentUserTranscription(update.user);
        setCurrentAgentTranscription(update.agent);
        
        if (update.isFinal) {
            setTranscriptionHistory(prev => [
                ...prev, 
                { speaker: 'user', text: update.user, timestamp: new Date() },
                { speaker: 'agent', text: update.agent, timestamp: new Date() }
            ]);
            setCurrentUserTranscription('');
            setCurrentAgentTranscription('');
        }
    };

    startSession({
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onError: handleError,
        onTranscriptionUpdate: handleTranscriptionUpdate
    });

    return () => {
        sessionClosed = true;
        closeSession();
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptionHistory, currentUserTranscription, currentAgentTranscription]);


  const handleEndCall = () => {
    closeSession();
    onLogout();
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'CONNECTING':
        return <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div><span>Connecting...</span></div>;
      case 'CONNECTED':
        return <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div><span>Connected</span></div>;
      case 'DISCONNECTED':
        return <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-gray-400 rounded-full"></div><span>Disconnected</span></div>;
      case 'ERROR':
        return <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span>Error</span></div>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-800 text-white">
      <header className="flex items-center justify-between p-4 bg-slate-900/50 shadow-md">
        <div className="flex items-center space-x-3">
          <BotIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold">Voice Agent</h1>
            <p className="text-sm text-slate-400">Welcome, {user.name}</p>
          </div>
        </div>
        <div className="text-sm">{getStatusIndicator()}</div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {transcriptionHistory.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.speaker === 'user' ? 'justify-end' : ''}`}>
            {msg.speaker === 'agent' && <div className="w-10 h-10 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center"><BotIcon className="w-6 h-6 text-white"/></div>}
            <div className={`max-w-xl p-4 rounded-2xl ${msg.speaker === 'user' ? 'bg-slate-700 rounded-br-none' : 'bg-slate-600 rounded-bl-none'}`}>
              <p>{msg.text}</p>
            </div>
            {msg.speaker === 'user' && <div className="w-10 h-10 rounded-full bg-slate-500 flex-shrink-0 flex items-center justify-center"><UserIcon className="w-6 h-6 text-white"/></div>}
          </div>
        ))}

        {currentUserTranscription && (
             <div className="flex items-start gap-3 justify-end opacity-70">
                 <div className="max-w-xl p-4 rounded-2xl bg-slate-700 rounded-br-none">
                     <p>{currentUserTranscription}</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-slate-500 flex-shrink-0 flex items-center justify-center"><UserIcon className="w-6 h-6 text-white"/></div>
             </div>
        )}
        {currentAgentTranscription && (
             <div className="flex items-start gap-3 opacity-70">
                <div className="w-10 h-10 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center"><BotIcon className="w-6 h-6 text-white"/></div>
                 <div className="max-w-xl p-4 rounded-2xl bg-slate-600 rounded-bl-none">
                     <p>{currentAgentTranscription}</p>
                 </div>
             </div>
        )}
        <div ref={transcriptEndRef} />
      </main>

      <footer className="p-4 bg-slate-900/50 flex items-center justify-center space-x-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
        </button>
        <button
          onClick={handleEndCall}
          className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full transition-transform transform hover:scale-105"
          title="End Call"
        >
          <PhoneIcon className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
};

export default UserPortal;
