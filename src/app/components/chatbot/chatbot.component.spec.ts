import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChatbotComponent } from './chatbot.component';
import { AiChatbotService } from '../../services/ai-chatbot.service';
import { ExpenseService } from '../../services/expense.service';

describe('ChatbotComponent', () => {
  let component: ChatbotComponent;
  let fixture: ComponentFixture<ChatbotComponent>;
  let chatService: AiChatbotService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatbotComponent, FormsModule],
      providers: [
        AiChatbotService,
        ExpenseService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotComponent);
    component = fixture.componentInstance;
    chatService = TestBed.inject(AiChatbotService);
    fixture.detectChanges();
  });

  it('should create chatbot component with initial open state', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(true);
  });

  it('should toggle minimize and open states', () => {
    expect(component.isMinimized()).toBe(false);
    component.toggleMinimize();
    expect(component.isMinimized()).toBe(true);

    component.toggleOpen();
    expect(component.isOpen()).toBe(false);
  });

  it('should prevent sending empty message', () => {
    const sendSpy = vi.spyOn(chatService, 'sendMessage');
    component.messageText = '   ';
    component.onSendMessage();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('should send valid message and clear input field', () => {
    const sendSpy = vi.spyOn(chatService, 'sendMessage');
    component.messageText = 'How much did I spend this month?';
    component.onSendMessage();

    expect(sendSpy).toHaveBeenCalledWith('How much did I spend this month?');
    expect(component.messageText).toBe('');
  });

  it('should send quick prompt when chip clicked', () => {
    const sendSpy = vi.spyOn(chatService, 'sendMessage');
    component.sendQuickPrompt('💡 Summarize my total spending');

    expect(sendSpy).toHaveBeenCalledWith('Summarize my total spending');
  });
});
