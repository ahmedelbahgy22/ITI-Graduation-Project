import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../../models/expense.model';
import { CategoryIconPipe } from '../../pipes/category-icon.pipe';

/**
 * Custom Validator preventing any dates in the future.
 */
export function noFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    // Parse input date string (expected format YYYY-MM-DD)
    const selectedDate = new Date(control.value);
    if (isNaN(selectedDate.getTime())) {
      return { invalidDate: true };
    }

    const today = new Date();
    // Normalize today to end of day to allow today's local date
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      return { futureDate: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CategoryIconPipe],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.css']
})
export class ExpenseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly expenseService = inject(ExpenseService);

  readonly categories = EXPENSE_CATEGORIES;
  expenseForm!: FormGroup;
  isSubmitting = false;

  get isEditMode(): boolean {
    return this.expenseService.editingExpense() !== null;
  }

  get editingExpenseId(): string | null {
    return this.expenseService.editingExpense()?.id ?? null;
  }

  constructor() {
    // Reactively watch editingExpense signal
    effect(() => {
      const current = this.expenseService.editingExpense();
      if (this.expenseForm) {
        if (current) {
          this.expenseForm.patchValue({
            amount: current.amount,
            category: current.category,
            date: current.date,
            note: current.note || ''
          });
          this.expenseForm.markAsPristine();
        } else {
          this.resetForm();
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.expenseForm = this.fb.group({
      amount: [
        null,
        [Validators.required, Validators.min(0.01)]
      ],
      category: [
        '',
        [Validators.required]
      ],
      date: [
        today,
        [Validators.required, noFutureDateValidator()]
      ],
      note: [
        '',
        [Validators.maxLength(150)]
      ]
    });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid || this.isSubmitting) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const formVal = this.expenseForm.value;
    const expenseData = {
      amount: Number(formVal.amount),
      category: formVal.category as ExpenseCategory,
      date: formVal.date,
      note: (formVal.note || '').trim()
    };

    this.isSubmitting = true;

    if (this.isEditMode && this.editingExpenseId) {
      this.expenseService.updateExpense(this.editingExpenseId, expenseData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.resetForm();
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.expenseService.addExpense(expenseData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.resetForm();
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  cancelEdit(): void {
    this.expenseService.setEditingExpense(null);
    this.resetForm();
  }

  resetForm(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.expenseForm.reset({
      amount: null,
      category: '',
      date: today,
      note: ''
    });
    this.expenseForm.markAsPristine();
    this.expenseForm.markAsUntouched();
  }

  // Field helper getters for template validation display
  get amountCtrl() {
    return this.expenseForm.get('amount');
  }

  get categoryCtrl() {
    return this.expenseForm.get('category');
  }

  get dateCtrl() {
    return this.expenseForm.get('date');
  }

  get noteCtrl() {
    return this.expenseForm.get('note');
  }
}
