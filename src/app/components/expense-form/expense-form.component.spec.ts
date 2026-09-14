import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ExpenseFormComponent, noFutureDateValidator } from './expense-form.component';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

describe('ExpenseFormComponent', () => {
  let component: ExpenseFormComponent;
  let fixture: ComponentFixture<ExpenseFormComponent>;
  let expenseService: ExpenseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseFormComponent, ReactiveFormsModule],
      providers: [
        ExpenseService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseFormComponent);
    component = fixture.componentInstance;
    expenseService = TestBed.inject(ExpenseService);
    fixture.detectChanges();
  });

  it('should create and initialize reactive form', () => {
    expect(component).toBeTruthy();
    expect(component.expenseForm).toBeDefined();
    expect(component.expenseForm.get('amount')).toBeDefined();
    expect(component.expenseForm.get('category')).toBeDefined();
    expect(component.expenseForm.get('date')).toBeDefined();
    expect(component.expenseForm.get('note')).toBeDefined();
  });

  it('should validate amount > 0', () => {
    const amountCtrl = component.expenseForm.get('amount');

    amountCtrl?.setValue(null);
    expect(amountCtrl?.valid).toBe(false);
    expect(amountCtrl?.hasError('required')).toBe(true);

    amountCtrl?.setValue(0);
    expect(amountCtrl?.valid).toBe(false);
    expect(amountCtrl?.hasError('min')).toBe(true);

    amountCtrl?.setValue(-10);
    expect(amountCtrl?.valid).toBe(false);

    amountCtrl?.setValue(25.5);
    expect(amountCtrl?.valid).toBe(true);
  });

  it('should validate category as required', () => {
    const categoryCtrl = component.expenseForm.get('category');

    categoryCtrl?.setValue('');
    expect(categoryCtrl?.valid).toBe(false);
    expect(categoryCtrl?.hasError('required')).toBe(true);

    categoryCtrl?.setValue('Food');
    expect(categoryCtrl?.valid).toBe(true);
  });

  it('should prevent future dates using custom validator', () => {
    const dateCtrl = component.expenseForm.get('date');

    // Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const tomorrowStr = tomorrow.toISOString().substring(0, 10);

    dateCtrl?.setValue(tomorrowStr);
    expect(dateCtrl?.valid).toBe(false);
    expect(dateCtrl?.hasError('futureDate')).toBe(true);

    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    dateCtrl?.setValue(yesterdayStr);
    expect(dateCtrl?.valid).toBe(true);

    // Today
    const todayStr = new Date().toISOString().substring(0, 10);
    dateCtrl?.setValue(todayStr);
    expect(dateCtrl?.valid).toBe(true);
  });

  it('should disable submit button when form is invalid', () => {
    component.expenseForm.patchValue({
      amount: null,
      category: '',
      date: ''
    });
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(component.expenseForm.invalid).toBe(true);
    expect(submitBtn.disabled).toBe(true);
  });

  it('should populate form when editingExpense signal changes', () => {
    const mockExpense: Expense = {
      id: '99',
      amount: 88.5,
      category: 'Shopping',
      date: '2026-03-01',
      note: 'Headphones'
    };

    expenseService.setEditingExpense(mockExpense);
    fixture.detectChanges();

    expect(component.isEditMode).toBe(true);
    expect(component.expenseForm.value.amount).toBe(88.5);
    expect(component.expenseForm.value.category).toBe('Shopping');
    expect(component.expenseForm.value.note).toBe('Headphones');
  });

  it('should switch back to create mode when cancelEdit is called', () => {
    const mockExpense: Expense = {
      id: '99',
      amount: 88.5,
      category: 'Shopping',
      date: '2026-03-01',
      note: 'Headphones'
    };

    expenseService.setEditingExpense(mockExpense);
    fixture.detectChanges();
    expect(component.isEditMode).toBe(true);

    component.cancelEdit();
    fixture.detectChanges();
    expect(component.isEditMode).toBe(false);
    expect(expenseService.editingExpense()).toBeNull();
  });
});
