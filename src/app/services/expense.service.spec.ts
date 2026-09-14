import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExpenseService } from './expense.service';
import { Expense } from '../models/expense.model';
import { environment } from '../../environments/environment';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let httpMock: HttpTestingController;

  const mockExpenses: Expense[] = [
    { id: '1', amount: 25, category: 'Food', date: '2026-03-10', note: 'Lunch' },
    { id: '2', amount: 150, category: 'Bills', date: '2026-03-11', note: 'Electricity' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExpenseService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ExpenseService);

    // Initial constructor load request
    const initReq = httpMock.expectOne(environment.apiUrl);
    initReq.flush(mockExpenses);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize with expenses loaded into signal', () => {
    expect(service.expenses().length).toBe(2);
    expect(service.expenses()[0].amount).toBe(25);
  });

  it('should add an expense and prepend to expenses signal', () => {
    const newExpense: Omit<Expense, 'id'> = {
      amount: 40,
      category: 'Transport',
      date: '2026-03-12',
      note: 'Taxi ride'
    };
    const createdResponse: Expense = { id: '3', ...newExpense };

    service.addExpense(newExpense).subscribe((created) => {
      expect(created.id).toBe('3');
    });

    const req = httpMock.expectOne(environment.apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(createdResponse);

    expect(service.expenses().length).toBe(3);
    expect(service.expenses()[0].id).toBe('3');
  });

  it('should update an existing expense and reflect in signal', () => {
    service.updateExpense('1', { amount: 30 }).subscribe((updated) => {
      expect(updated.amount).toBe(30);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockExpenses[0], amount: 30 });

    const target = service.expenses().find((e) => e.id === '1');
    expect(target?.amount).toBe(30);
  });

  it('should delete an expense and remove from expenses signal', () => {
    service.deleteExpense('1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.expenses().length).toBe(1);
    expect(service.expenses().some((e) => e.id === '1')).toBe(false);
  });

  it('should manage editingExpense signal correctly', () => {
    expect(service.editingExpense()).toBeNull();

    service.setEditingExpense(mockExpenses[0]);
    expect(service.editingExpense()?.id).toBe('1');

    service.setEditingExpense(null);
    expect(service.editingExpense()).toBeNull();
  });
});
