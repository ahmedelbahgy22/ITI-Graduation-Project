import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HighlightOverBudgetDirective } from './highlight-over-budget.directive';

@Component({
  standalone: true,
  imports: [HighlightOverBudgetDirective],
  template: `
    <div id="item1" [appHighlightOverBudget]="150">Item 1</div>
    <div id="item2" [appHighlightOverBudget]="50">Item 2</div>
    <div id="item3" [appHighlightOverBudget]="75" [threshold]="50">Item 3</div>
  `
})
class TestHostComponent {}

describe('HighlightOverBudgetDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should add over-budget class and red border when amount exceeds default threshold (100)', () => {
    const item1 = fixture.nativeElement.querySelector('#item1') as HTMLElement;
    expect(item1.classList.contains('over-budget')).toBe(true);
    expect(item1.style.borderLeft).toContain('solid');
  });

  it('should not highlight when amount is below default threshold (100)', () => {
    const item2 = fixture.nativeElement.querySelector('#item2') as HTMLElement;
    expect(item2.classList.contains('over-budget')).toBe(false);
  });

  it('should honor custom threshold', () => {
    const item3 = fixture.nativeElement.querySelector('#item3') as HTMLElement;
    expect(item3.classList.contains('over-budget')).toBe(true);
  });
});
