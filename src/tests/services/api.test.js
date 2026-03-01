import { getWeather } from '../../services/api';

// This test uses a real fetch call, which may or may not work depending
// on network availability. In CI you'd mock fetch or use jest-fetch-mock.

describe('api service', () => {
  it('exports a function', () => {
    expect(typeof getWeather).toBe('function');
  });
});
