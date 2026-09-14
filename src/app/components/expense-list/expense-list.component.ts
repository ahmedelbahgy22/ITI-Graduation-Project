import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { EXPENSE_CATEGORIES, Expense, SortOption } from '../../models/expense.model';
import { CategoryIconPipe } from '../../pipes/category-icon.pipe';
import { HighlightOverBudgetDirective } from '../../directives/highlight-over-budget.directive';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CategoryIconPipe,
    HighlightOverBudgetDirective
  ],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.css']
})
export class ExpenseListComponent {
  readonly expenseService = inject(ExpenseService);

  readonly categories = ['All', ...EXPENSE_CATEGORIES];

  // Filter & Sort State Signals
  readonly selectedCategory = signal<string>('All');
  readonly searchTerm = signal<string>('');
  readonly sortBy = signal<SortOption>('date-desc');
  readonly budgetThreshold = signal<number>(100);

  // Computed signal for filtered & sorted expenses
  readonly filteredExpenses = computed(() => {
    const rawExpenses = this.expenseService.expenses();
    const category = this.selectedCategory();
    const query = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    // 1. Filter by Category
    let result = rawExpenses;
    if (category !== 'All') {
      result = result.filter((exp) => exp.category.toLowerCase() === category.toLowerCase());
    }

    // 2. Filter by Note / Search Text
    if (query) {
      result = result.filter(
        (exp) =>
          (exp.note && exp.note.toLowerCase().includes(query)) ||
          exp.category.toLowerCase().includes(query)
      );
    }

    // 3. Sort by chosen option
    return [...result].sort((a, b) => {
      switch (sort) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
  });

  // Computed signal for running currency total of the filtered view
  readonly filteredTotal = computed(() => {
    return this.filteredExpenses().reduce(
      (sum, exp) => sum + (Number(exp.amount) || 0),
      0
    );
  });

  // Computed count of over-budget items in the filtered view
  readonly overBudgetCount = computed(() => {
    const threshold = this.budgetThreshold();
    return this.filteredExpenses().filter((exp) => Number(exp.amount) > threshold).length;
  });

  onCategoryChange(cat: string): void {
    this.selectedCategory.set(cat);
  }

  onSearchChange(text: string): void {
    this.searchTerm.set(text);
  }

  onSortChange(option: SortOption): void {
    this.sortBy.set(option);
  }

  onThresholdChange(threshold: number): void {
    this.budgetThreshold.set(threshold);
  }

  onEdit(expense: Expense): void {
    this.expenseService.setEditingExpense(expense);
    // Scroll smoothly to form
    const formElement = document.querySelector('app-expense-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onDelete(expense: Expense): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${expense.note || expense.category}" ($${expense.amount.toFixed(2)})?`
    );
    if (confirmed) {
      this.expenseService.deleteExpense(expense.id).subscribe();
    }
  }

  reload(): void {
    this.expenseService.loadExpenses().subscribe();
  }
}
