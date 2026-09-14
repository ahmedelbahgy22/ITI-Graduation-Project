import { Expense } from './expense.model';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface ChatPayload {
  message: string;
  sessionId: string;
  expenses: Expense[];
}

export interface ChatResponse {
  reply?: string;
  message?: string;
  output?: string;
  text?: string;
  response?: string;
}
