
import { InteractionLog, SystemPrompt, KnowledgeBaseItem, AppSettings, User } from '../types';

// --- Mock Data ---

const mockUsers: User[] = [
  { name: 'Alice Johnson', phone: '555-0101' },
  { name: 'Bob Williams', phone: '555-0102' },
];

const mockLogs: InteractionLog[] = [
  {
    id: 'log1',
    user: mockUsers[0],
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 1.9 * 60 * 60 * 1000),
    duration: 360,
    transcript: [],
    events: [],
  },
  {
    id: 'log2',
    user: mockUsers[1],
    startTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 4.8 * 60 * 60 * 1000),
    duration: 720,
    transcript: [],
    events: [],
  },
   {
    id: 'log3',
    user: mockUsers[0],
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 23.95 * 60 * 60 * 1000),
    duration: 180,
    transcript: [],
    events: [],
  },
];

let mockPrompts: SystemPrompt[] = [
  {
    id: 'prompt1',
    name: 'Friendly Customer Support',
    content: 'You are a friendly and helpful customer support agent. Your goal is to resolve issues with a positive attitude.',
    isActive: true,
  },
  {
    id: 'prompt2',
    name: 'Technical Support Tier 2',
    content: 'You are a technical expert. Provide clear, concise, and accurate technical information. Be direct and professional.',
    isActive: false,
  },
];

let mockKnowledge: KnowledgeBaseItem[] = [
  {
    id: 'kb1',
    fileName: 'product_manual_v1.2.pdf',
    fileType: 'application/pdf',
    uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'kb2',
    fileName: 'faq_2024.docx',
    fileType: 'application/msword',
    uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

let mockSettings: AppSettings = {
  language: 'English',
};

// --- Mock API Functions ---

const simulateDelay = <T,>(data: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), 500 + Math.random() * 500));

export const getInteractionLogs = (): Promise<InteractionLog[]> => {
  return simulateDelay([...mockLogs].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
};

export const getSystemPrompts = (): Promise<SystemPrompt[]> => {
  return simulateDelay(mockPrompts);
};

export const updateSystemPrompt = (updatedPrompt: SystemPrompt): Promise<SystemPrompt> => {
  mockPrompts = mockPrompts.map(p => p.id === updatedPrompt.id ? updatedPrompt : p);
  return simulateDelay(updatedPrompt);
};

export const addSystemPrompt = (newPrompt: Omit<SystemPrompt, 'id'>): Promise<SystemPrompt> => {
  const prompt = { ...newPrompt, id: `prompt${Date.now()}` };
  mockPrompts.push(prompt);
  return simulateDelay(prompt);
};

export const deleteSystemPrompt = (id: string): Promise<{ success: boolean }> => {
  mockPrompts = mockPrompts.filter(p => p.id !== id);
  return simulateDelay({ success: true });
};

export const getKnowledgeBase = (): Promise<KnowledgeBaseItem[]> => {
  return simulateDelay(mockKnowledge);
};

export const uploadKnowledgeItem = (file: { name: string, type: string }): Promise<KnowledgeBaseItem> => {
  const newItem: KnowledgeBaseItem = {
    id: `kb${Date.now()}`,
    fileName: file.name,
    fileType: file.type,
    uploadDate: new Date(),
  };
  mockKnowledge.push(newItem);
  return simulateDelay(newItem);
};

export const deleteKnowledgeItem = (id: string): Promise<{ success: boolean }> => {
  mockKnowledge = mockKnowledge.filter(item => item.id !== id);
  return simulateDelay({ success: true });
};

export const getSettings = (): Promise<AppSettings> => {
  return simulateDelay(mockSettings);
};

export const updateSettings = (newSettings: AppSettings): Promise<AppSettings> => {
  mockSettings = newSettings;
  return simulateDelay(mockSettings);
};
