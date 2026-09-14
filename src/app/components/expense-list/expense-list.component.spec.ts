import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ExpenseListComponent } from './expense-list.component';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

describe('ExpenseListComponent', () => {
  let component: ExpenseListComponent;
  let fixture: ComponentFixture<ExpenseListComponent>;
  let expenseService: ExpenseService;

  const mockData: Expense[] = [
    { id: '1', amount: 30, category: 'Food', date: '2026-03-01', note: 'Grocery fruit' },
    { id: '2', amount: 150, category: 'Bills', date: '2026-03-05', note: 'Electricity bill' },
    { id: '3', amount: 60, category: 'Transport', date: '2026-03-10', note: 'Gas fill-up' },
    { id: '4', amount: 200, category: 'Shopping', date: '2026-03-08', note: 'New jacket' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseListComponent],
      providers: [
        ExpenseService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseListComponent);
    component = fixture.componentInstance;
    expenseService = TestBed.inject(ExpenseService);

    // Directly set mock expenses in service signal
    expenseService.expenses.set(mockData);
    fixture.detectChanges();
  });

  it('should initialize and show all expenses', () => {
    expect(component.filteredExpenses().length).toBe(4);
    expect(component.filteredTotal()).toBe(440);
  });

  it('should filter expenses by category signal', () => {
    component.onCategoryChange('Food');
    fixture.detectChanges();

    expect(component.filteredExpenses().length).toBe(1);
    expect(component.filteredExpenses()[0].category).toBe('Food');
    expect(component.filteredTotal()).toBe(30);
  });

  it('should filter expenses by note search text', () => {
    component.onSearchChange('jacket');
    fixture.detectChanges();

    expect(component.filteredExpenses().length).toBe(1);
    expect(component.filteredExpenses()[0].note).toBe('New jacket');
    expect(component.filteredTotal()).toBe(200);
  });

  it('should sort expenses by amount descending', () => {
    component.onSortChange('amount-desc');
    fixture.detectChanges();

    const sorted = component.filteredExpenses();
    expect(sorted[0].amount).toBe(200);
    expect(sorted[1].amount).toBe(150);
    expect(sorted[2].amount).toBe(60);
    expect(sorted[3].amount).toBe(30);
  });

  it('should sort expenses by date newest first', () => {
    component.onSortChange('date-desc');
    fixture.detectChanges();

    const sorted = component.filteredExpenses();
    expect(sorted[0].date).toBe('2026-03-10');
    expect(sorted[3].date).toBe('2026-03-01');
  });

  it('should compute over-budget count based on threshold signal', () => {
    // Default threshold is 100 -> items with >100 are #2 (150) and #4 (200) => 2
    expect(component.overBudgetCount()).toBe(2);

    // Change threshold to 160 -> only item #4 (200) => 1
    component.onThresholdChange(160);
    fixture.detectChanges();
    expect(component.overBudgetCount()).toBe(1);
  });

  it('should trigger edit mode on service when onEdit is called', () => {
    component.onEdit(mockData[1]);
    expect(expenseService.editingExpense()?.id).toBe('2');
  });
});
