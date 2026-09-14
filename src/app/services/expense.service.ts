import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { Expense } from '../models/expense.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Global State Signals
  readonly expenses = signal<Expense[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly editingExpense = signal<Expense | null>(null);

  constructor() {
    this.loadExpenses().subscribe({
      error: (err) => console.warn('Initial load: json-server may not be started yet.', err)
    });
  }

  loadExpenses(): Observable<Expense[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<Expense[]>(this.apiUrl).pipe(
      tap((data) => {
        this.expenses.set(data || []);
      }),
      catchError((err) => {
        const errorMsg = 'Failed to load expenses. Ensure json-server is running at ' + this.apiUrl;
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => {
        this.loading.set(false);
      })
    );
  }

  addExpense(expense: Omit<Expense, 'id'>): Observable<Expense> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<Expense>(this.apiUrl, expense).pipe(
      tap((createdExpense) => {
        this.expenses.update((current) => [createdExpense, ...current]);
      }),
      catchError((err) => {
        const errorMsg = 'Failed to add expense. Check network connection or server status.';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => {
        this.loading.set(false);
      })
    );
  }

  updateExpense(id: string, updatedData: Partial<Expense>): Observable<Expense> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.patch<Expense>(`${this.apiUrl}/${id}`, updatedData).pipe(
      tap((savedExpense) => {
        this.expenses.update((current) =>
          current.map((exp) => (String(exp.id) === String(id) ? { ...exp, ...savedExpense } : exp))
        );
        if (this.editingExpense()?.id === id) {
          this.editingExpense.set(null);
        }
      }),
      catchError((err) => {
        const errorMsg = `Failed to update expense #${id}.`;
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => {
        this.loading.set(false);
      })
    );
  }

  deleteExpense(id: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.expenses.update((current) =>
          current.filter((exp) => String(exp.id) !== String(id))
        );
        if (this.editingExpense()?.id === id) {
          this.editingExpense.set(null);
        }
      }),
      catchError((err) => {
        const errorMsg = `Failed to delete expense #${id}.`;
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => {
        this.loading.set(false);
      })
    );
  }

  setEditingExpense(expense: Expense | null): void {
    this.editingExpense.set(expense);
  }

  clearError(): void {
    this.error.set(null);
  }
}
