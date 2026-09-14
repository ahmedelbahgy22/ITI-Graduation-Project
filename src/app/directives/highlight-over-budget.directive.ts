import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appHighlightOverBudget]',
  standalone: true
})
export class HighlightOverBudgetDirective implements OnChanges {
  /**
   * Can be passed either the expense amount directly (e.g. [appHighlightOverBudget]="expense.amount")
   * or used as a flag with a custom threshold (e.g. [appHighlightOverBudget]="150" [amount]="expense.amount").
   */
  @Input('appHighlightOverBudget') amountOrThreshold?: number | string | null;
  @Input() amount?: number | null;
  @Input() threshold: number = 100;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.updateHighlight();
  }

  private updateHighlight(): void {
    let resolvedAmount: number;
    let resolvedThreshold = this.threshold ?? 100;

    if (this.amount !== undefined && this.amount !== null) {
      resolvedAmount = Number(this.amount);
      if (this.amountOrThreshold !== undefined && this.amountOrThreshold !== null && this.amountOrThreshold !== '') {
        const customThreshold = Number(this.amountOrThreshold);
        if (!isNaN(customThreshold)) {
          resolvedThreshold = customThreshold;
        }
      }
    } else if (this.amountOrThreshold !== undefined && this.amountOrThreshold !== null && this.amountOrThreshold !== '') {
      resolvedAmount = Number(this.amountOrThreshold);
    } else {
      resolvedAmount = 0;
    }

    const isOverBudget = !isNaN(resolvedAmount) && resolvedAmount > resolvedThreshold;

    if (isOverBudget) {
      this.renderer.addClass(this.el.nativeElement, 'over-budget');
      this.renderer.setStyle(this.el.nativeElement, 'background-color', 'rgba(239, 68, 68, 0.12)');
      this.renderer.setStyle(this.el.nativeElement, 'border-left', '4px solid #ef4444');
      this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.2s ease-in-out');
      this.renderer.setAttribute(
        this.el.nativeElement,
        'title',
        `Over budget threshold of $${resolvedThreshold} (Amount: $${resolvedAmount})`
      );
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'over-budget');
      this.renderer.removeStyle(this.el.nativeElement, 'background-color');
      this.renderer.removeStyle(this.el.nativeElement, 'border-left');
      this.renderer.removeAttribute(this.el.nativeElement, 'title');
    }
  }
}
