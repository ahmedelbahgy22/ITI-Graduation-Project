import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryIcon',
  standalone: true
})
export class CategoryIconPipe implements PipeTransform {
  private readonly iconMap: Record<string, string> = {
    Food: '🍔',
    Transport: '🚗',
    Shopping: '🛍️',
    Bills: '📄',
    Entertainment: '🎬',
    Other: '🏷️'
  };

  transform(category: string | undefined | null): string {
    if (!category) {
      return '💰';
    }
    return this.iconMap[category] ?? '💰';
  }
}
