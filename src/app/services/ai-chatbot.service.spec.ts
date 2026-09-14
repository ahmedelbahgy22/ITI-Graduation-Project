import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AiChatbotService } from './ai-chatbot.service';
import { ExpenseService } from './expense.service';
import { environment } from '../../environments/environment';

describe('AiChatbotService', () => {
  let service: AiChatbotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiChatbotService,
        ExpenseService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AiChatbotService);

    // Flush initial expense load request triggered by ExpenseService instantiation
    const initReq = httpMock.expectOne(environment.apiUrl);
    initReq.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize with session ID and welcome message', () => {
    expect(service.sessionId).toBeTruthy();
    expect(service.messages().length).toBe(1);
    expect(service.messages()[0].sender).toBe('ai');
  });

  it('should post payload containing message, sessionId, and expenses to n8n webhook', () => {
    service.sendMessage('How much did I spend?');

    // Should have user message immediately
    expect(service.messages().length).toBe(2);
    expect(service.messages()[1].text).toBe('How much did I spend?');
    expect(service.messages()[1].sender).toBe('user');
    expect(service.isLoading()).toBe(true);

    const req = httpMock.expectOne(environment.n8nWebhookUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      message: 'How much did I spend?',
      sessionId: service.sessionId,
      expenses: []
    });

    req.flush({ reply: 'You have spent $0 so far.' });

    expect(service.isLoading()).toBe(false);
    expect(service.messages().length).toBe(3);
    expect(service.messages()[2].sender).toBe('ai');
    expect(service.messages()[2].text).toBe('You have spent $0 so far.');
  });

  it('should handle webhook error and provide fallback context message', () => {
    service.sendMessage('Analyze my budget');

    const req = httpMock.expectOne(environment.n8nWebhookUrl);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Internal Server Error' });

    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeTruthy();
    const lastMsg = service.messages()[service.messages().length - 1];
    expect(lastMsg.sender).toBe('ai');
    expect(lastMsg.isError).toBe(true);
    expect(lastMsg.text).toContain('Note: Unable to reach n8n webhook');
  });

  it('should not send empty or whitespace-only messages', () => {
    service.sendMessage('   ');
    expect(service.messages().length).toBe(1);
    httpMock.expectNone(environment.n8nWebhookUrl);
  });

  it('should clear history back to welcome message', () => {
    service.clearHistory();
    expect(service.messages().length).toBe(1);
    expect(service.error()).toBeNull();
  });
});
