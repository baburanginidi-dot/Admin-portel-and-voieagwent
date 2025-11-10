
export interface User {
  name: string;
  phone: string;
}

export interface InteractionLog {
  id: string;
  user: User;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  transcript: TranscriptMessage[];
  events: { type: string; timestamp: Date }[];
}

export interface TranscriptMessage {
  speaker: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
}

export interface KnowledgeBaseItem {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: Date;
}

export interface AppSettings {
  language: 'English' | 'Telugu' | 'Hindi';
}
