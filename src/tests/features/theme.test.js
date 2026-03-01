import reducer, { updateColor } from '../../features/theme';

describe('theme slice', () => {
  it('should return initial state', () => {
    const initial = reducer(undefined, { type: 'unknown' });
    expect(initial).toEqual({ value: '' });
  });

  it('should handle updateColor', () => {
    const prev = { value: 'blue' };
    const next = reducer(prev, updateColor('red'));
    expect(next.value).toBe('red');
  });
});
