import { CategoryIconPipe } from './category-icon.pipe';

describe('CategoryIconPipe', () => {
  let pipe: CategoryIconPipe;

  beforeEach(() => {
    pipe = new CategoryIconPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform Food to 🍔', () => {
    expect(pipe.transform('Food')).toBe('🍔');
  });

  it('should transform Transport to 🚗', () => {
    expect(pipe.transform('Transport')).toBe('🚗');
  });

  it('should transform Shopping to 🛍️', () => {
    expect(pipe.transform('Shopping')).toBe('🛍️');
  });

  it('should transform Bills to 📄', () => {
    expect(pipe.transform('Bills')).toBe('📄');
  });

  it('should transform Entertainment to 🎬', () => {
    expect(pipe.transform('Entertainment')).toBe('🎬');
  });

  it('should transform Other to 🏷️', () => {
    expect(pipe.transform('Other')).toBe('🏷️');
  });

  it('should fallback to 💰 for unknown or empty categories', () => {
    expect(pipe.transform('Unknown')).toBe('💰');
    expect(pipe.transform('')).toBe('💰');
    expect(pipe.transform(null)).toBe('💰');
    expect(pipe.transform(undefined)).toBe('💰');
  });
});
