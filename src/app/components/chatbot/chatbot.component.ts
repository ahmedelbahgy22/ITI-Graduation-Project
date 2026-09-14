import { Component, ElementRef, ViewChild, afterNextRender, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatbotService } from '../../services/ai-chatbot.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
  readonly chatService = inject(AiChatbotService);

  @ViewChild('scrollContainer') private readonly scrollContainer?: ElementRef<HTMLDivElement>;

  // Widget State
  readonly isOpen = signal<boolean>(true);
  readonly isMinimized = signal<boolean>(false);
  messageText = '';

  readonly webhookEndpoint = environment.n8nWebhookUrl;

  readonly quickPrompts = [
    '💡 Summarize my total spending',
    '🍔 How much did I spend on Food?',
    '⚠️ Which expenses are over budget?',
    '📊 Tips to optimize my expenses'
  ];

  constructor() {
    // Whenever new messages arrive, auto-scroll to bottom
    afterNextRender(() => {
      this.scrollToBottom();
    });
  }

  toggleOpen(): void {
    this.isOpen.update((v) => !v);
  }

  toggleMinimize(): void {
    this.isMinimized.update((v) => !v);
  }

  onSendMessage(): void {
    const text = this.messageText.trim();
    if (!text || this.chatService.isLoading()) {
      return;
    }

    this.chatService.sendMessage(text);
    this.messageText = '';
    this.scrollToBottom();
  }

  sendQuickPrompt(prompt: string): void {
    // Strip leading emoji
    const cleanPrompt = prompt.replace(/^[\p{Emoji}\s]+/u, '').trim();
    this.chatService.sendMessage(cleanPrompt || prompt);
    this.scrollToBottom();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  clearChat(): void {
    this.chatService.clearHistory();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // Ignore scroll calculation errors
    }
  }
}
