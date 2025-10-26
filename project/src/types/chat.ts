export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  imageUrl?: string;
  isImage?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentInput: string;
  error: string | null;
}