import React, { useState, useEffect, useRef } from 'react';
import { InteractionLog, SystemPrompt, KnowledgeBaseItem, AppSettings } from '../types';
import * as api from '../services/api';
import { ArrowLeftIcon, FileTextIcon, MessageSquareIcon, SettingsIcon, TrashIcon, PlusIcon, UserIcon, EditIcon } from './icons/Icons';

type Tab = 'logs' | 'prompts' | 'knowledge' | 'settings';

const AdminPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('logs');
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeBaseItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [logsData, promptsData, knowledgeData, settingsData] = await Promise.all([
        api.getInteractionLogs(),
        api.getSystemPrompts(),
        api.getKnowledgeBase(),
        api.getSettings(),
      ]);
      setLogs(logsData);
      setPrompts(promptsData);
      setKnowledge(knowledgeData.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()));
      setSettings(settingsData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div></div>;
    }
    switch (activeTab) {
      case 'logs': return <LogsTab logs={logs} />;
      case 'prompts': return <PromptsTab prompts={prompts} setPrompts={setPrompts} />;
      case 'knowledge': return <KnowledgeTab knowledge={knowledge} setKnowledge={setKnowledge} />;
      case 'settings': return <SettingsTab settings={settings} setSettings={setSettings} />;
      default: return null;
    }
  };

  const TabButton = ({ tab, icon, label }: { tab: Tab, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${
        activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <nav className="w-full md:w-64 bg-slate-800 p-4 flex-shrink-0">
        <div className="flex items-center space-x-3 mb-8">
            <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
        </div>
        <div className="space-y-2">
            <TabButton tab="logs" icon={<UserIcon className="w-6 h-6" />} label="Interaction Logs"/>
            <TabButton tab="prompts" icon={<MessageSquareIcon className="w-6 h-6" />} label="System Prompts"/>
            <TabButton tab="knowledge" icon={<FileTextIcon className="w-6 h-6" />} label="Knowledge Base"/>
            <TabButton tab="settings" icon={<SettingsIcon className="w-6 h-6" />} label="Settings"/>
        </div>
      </nav>
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};


const LogsTab: React.FC<{ logs: InteractionLog[] }> = ({ logs }) => (
  <div>
    <h2 className="text-3xl font-bold mb-6 text-white">Interaction Logs</h2>
    <div className="bg-slate-800 rounded-lg shadow overflow-hidden">
      <div className="divide-y divide-slate-700">
        {logs.map(log => (
          <div key={log.id} className="p-4 hover:bg-slate-700/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-white">{log.user.name} <span className="text-slate-400 font-normal">- {log.user.phone}</span></p>
                <p className="text-sm text-slate-400">{log.startTime.toLocaleString()}</p>
              </div>
              <span className="text-sm text-slate-300">{(log.duration / 60).toFixed(1)} min</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PromptsTab: React.FC<{ prompts: SystemPrompt[], setPrompts: React.Dispatch<React.SetStateAction<SystemPrompt[]>> }> = ({ prompts, setPrompts }) => {
    const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);

    const handleEditStart = (prompt: SystemPrompt) => {
        setEditingPrompt({ ...prompt }); // Create a copy to edit
    };

    const handleEditCancel = () => {
        setEditingPrompt(null);
    };

    const handleEditSave = async () => {
        if (!editingPrompt) return;
        try {
            const updatedPrompt = await api.updateSystemPrompt(editingPrompt);
            setPrompts(prevPrompts =>
                prevPrompts.map(p => (p.id === updatedPrompt.id ? updatedPrompt : p))
            );
            setEditingPrompt(null);
        } catch (error) {
            console.error("Failed to update prompt:", error);
        }
    };
    
    const handleToggleActive = (id: string) => {
        const promptToUpdate = prompts.find(p => p.id === id);
        if (promptToUpdate) {
            api.updateSystemPrompt({ ...promptToUpdate, isActive: !promptToUpdate.isActive })
                .then(updatedPrompt => {
                    setPrompts(prompts.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
                });
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await api.deleteSystemPrompt(id);
            setPrompts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Failed to delete prompt:", error);
        }
    };

    const handleAddPrompt = async () => {
        const newPromptData = {
            name: 'New Prompt',
            content: 'A new prompt description. Click to edit.',
            isActive: false,
        };
        try {
            const addedPrompt = await api.addSystemPrompt(newPromptData);
            setPrompts(prev => [...prev, addedPrompt]);
        } catch (error) {
            console.error("Failed to add prompt:", error);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-white">System Prompts</h2>
            <div className="space-y-4">
                {prompts.map(prompt => (
                    <div key={prompt.id} className="bg-slate-800 rounded-lg p-4 flex items-start justify-between gap-4">
                        {editingPrompt?.id === prompt.id ? (
                            <div className="flex-grow">
                                <input
                                    type="text"
                                    value={editingPrompt.name}
                                    onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md text-white font-semibold p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                <textarea
                                    value={editingPrompt.content}
                                    onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md text-slate-300 p-2 h-24 resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    rows={3}
                                />
                            </div>
                        ) : (
                            <div className="flex-grow min-w-0">
                                <h3 className="font-semibold text-white">{prompt.name}</h3>
                                <p className="text-slate-400 mt-1 break-words">{prompt.content}</p>
                            </div>
                        )}
                        
                        <div className="flex items-center space-x-3 flex-shrink-0">
                             {editingPrompt?.id === prompt.id ? (
                                <>
                                    <button onClick={handleEditSave} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-3 rounded-md transition-colors">Save</button>
                                    <button onClick={handleEditCancel} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-1 px-3 rounded-md transition-colors">Cancel</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => handleEditStart(prompt)} className="text-slate-400 hover:text-cyan-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!!editingPrompt}>
                                        <EditIcon className="w-5 h-5"/>
                                    </button>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={prompt.isActive} onChange={() => handleToggleActive(prompt.id)} className="sr-only peer" disabled={!!editingPrompt} />
                                        <div className={`w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600 ${!!editingPrompt ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}></div>
                                    </label>
                                    <button onClick={() => handleDelete(prompt.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!!editingPrompt}>
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={handleAddPrompt} className="mt-6 flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50" disabled={!!editingPrompt}>
                <PlusIcon className="w-5 h-5"/>
                <span>Add Prompt</span>
            </button>
        </div>
    );
};

const KnowledgeTab: React.FC<{ knowledge: KnowledgeBaseItem[], setKnowledge: React.Dispatch<React.SetStateAction<KnowledgeBaseItem[]>> }> = ({ knowledge, setKnowledge }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const newItem = await api.uploadKnowledgeItem({ name: file.name, type: file.type });
                setKnowledge(prevKnowledge => [newItem, ...prevKnowledge]);
            } catch (error) {
                console.error("Failed to upload document:", error);
            }
        }
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await api.deleteKnowledgeItem(id);
            setKnowledge(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Failed to delete document:", error);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-white">Knowledge Base</h2>
            <div className="bg-slate-800 rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-slate-700">
                    {knowledge.map(item => (
                        <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-700/50">
                            <div>
                                <p className="font-semibold text-white">{item.fileName}</p>
                                <p className="text-sm text-slate-400">Uploaded on {item.uploadDate.toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.txt"
            />
            <button onClick={handleUploadClick} className="mt-6 flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon className="w-5 h-5"/>
                <span>Upload Document</span>
            </button>
        </div>
    );
};


const SettingsTab: React.FC<{ settings: AppSettings | null, setSettings: React.Dispatch<React.SetStateAction<AppSettings | null>> }> = ({ settings, setSettings }) => {
    if(!settings) return null;

    const handleSaveChanges = async () => {
        try {
            await api.updateSettings(settings);
            // Optionally show a success message
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-white">Settings</h2>
            <div className="max-w-md space-y-6">
                <div>
                    <label htmlFor="language" className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                    <select id="language" value={settings.language} onChange={e => setSettings({...settings, language: e.target.value as AppSettings['language']})} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <option>English</option>
                        <option>Telugu</option>
                        <option>Hindi</option>
                    </select>
                </div>
                <button onClick={handleSaveChanges} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Save Changes</button>
            </div>
        </div>
    );
};

export default AdminPortal;