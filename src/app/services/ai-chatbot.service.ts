import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ChatMessage, ChatPayload, ChatResponse } from '../models/chat.model';
import { ExpenseService } from './expense.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiChatbotService {
  private readonly http = inject(HttpClient);
  private readonly expenseService = inject(ExpenseService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly sessionId: string = this.getOrCreateSessionId();

  constructor() {
    // Initial friendly greeting message
    this.messages.set([
      {
        id: 'welcome-msg',
        sender: 'ai',
        text: 'Hello! 👋 I am your AI Expense Assistant. Ask me anything about your spending habits, category breakdowns, or budget tips! I have real-time context of your expenses.',
        timestamp: new Date()
      }
    ]);
  }

  private getOrCreateSessionId(): string {
    const key = 'expense_tracker_ai_session_id';
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
    if (stored) return stored;

    const newId = 'session_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, newId);
    }
    return newId;
  }

  sendMessage(rawText: string): void {
    const text = rawText.trim();
    if (!text || this.isLoading()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now() + '-u',
      sender: 'user',
      text,
      timestamp: new Date()
    };

    // Add user message to history
    this.messages.update((msgs) => [...msgs, userMessage]);
    this.isLoading.set(true);
    this.error.set(null);

    const currentExpenses = this.expenseService.expenses();
    const payload: ChatPayload = {
      message: text,
      sessionId: this.sessionId,
      expenses: currentExpenses
    };

    const webhookUrl = environment.n8nWebhookUrl;

    this.http.post<any>(webhookUrl, payload).pipe(
      tap((res) => {
        const replyText = this.extractReply(res);
        const aiMessage: ChatMessage = {
          id: 'msg-' + Date.now() + '-ai',
          sender: 'ai',
          text: replyText,
          timestamp: new Date()
        };
        this.messages.update((msgs) => [...msgs, aiMessage]);
      }),
      catchError((err: HttpErrorResponse) => {
        const errMsg = `Webhook request failed (${err.status ? 'HTTP ' + err.status : 'Network error'}).`;
        this.error.set(errMsg);

        // Provide intelligent local fallback context when n8n webhook is not running
        const fallbackReply = this.generateFallbackInsight(text, currentExpenses, webhookUrl);

        const aiErrorMessage: ChatMessage = {
          id: 'msg-' + Date.now() + '-err',
          sender: 'ai',
          text: fallbackReply,
          timestamp: new Date(),
          isError: true
        };
        this.messages.update((msgs) => [...msgs, aiErrorMessage]);

        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe({
      error: () => {
        // Handled in catchError
      }
    });
  }

  private extractReply(response: any): string {
    if (!response) return 'Received empty response from AI assistant.';
    if (typeof response === 'string') return response;

    // Handle common n8n node output formats
    if (Array.isArray(response) && response.length > 0) {
      const first = response[0];
      return (
        first?.reply ||
        first?.message ||
        first?.output ||
        first?.text ||
        first?.response ||
        first?.json?.reply ||
        first?.json?.message ||
        first?.json?.output ||
        JSON.stringify(first)
      );
    }

    return (
      response.reply ||
      response.message ||
      response.output ||
      response.text ||
      response.response ||
      JSON.stringify(response)
    );
  }

  private generateFallbackInsight(query: string, expenses: any[], webhookUrl: string): string {
    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = expenses.length;
    
    // Group by category
    const catTotals: Record<string, number> = {};
    for (const exp of expenses) {
      catTotals[exp.category] = (catTotals[exp.category] || 0) + Number(exp.amount);
    }
    const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

    return `⚠️ Note: Unable to reach n8n webhook at "${webhookUrl}". Check that n8n is active and CORS is enabled.

🤖 [Local Context Assistant Analysis]:
• Total tracked expenses: $${total.toFixed(2)} across ${count} entries.
• Highest spending category: ${topCategory ? `${topCategory[0]} ($${topCategory[1].toFixed(2)})` : 'None yet'}.
• Your query was: "${query}". Once your n8n workflow is live, full AI LLM reasoning will respond directly!`;
  }

  clearHistory(): void {
    this.messages.set([
      {
        id: 'welcome-msg',
        sender: 'ai',
        text: 'Chat history cleared. How else can I assist with your expenses today?',
        timestamp: new Date()
      }
    ]);
    this.error.set(null);
  }
}
