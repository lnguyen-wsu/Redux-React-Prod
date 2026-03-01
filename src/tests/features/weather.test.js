import { configureStore } from '@reduxjs/toolkit';
import reducer, { fetchWeather, updateWeather } from '../../features/weather';
import * as api from '../../services/api';

// helper that returns a store instance with just the weather slice
function createTestStore() {
  return configureStore({
    reducer: {
      weather: reducer,
    },
  });
}

describe('weather slice', () => {
  it('should return initial state', () => {
    const initial = reducer(undefined, { type: 'unknown' });
    expect(initial).toEqual({ value: '', status: 'idle', error: null });
  });

  it('should handle updateWeather reducer', () => {
    const prev = { value: '', status: 'idle', error: null };
    const next = reducer(prev, updateWeather('42')); // payload
    expect(next.value).toBe('42');
  });

  it('fetchWeather thunk success', async () => {
    jest.spyOn(api, 'getWeather').mockResolvedValue(123);

    const store = createTestStore();
    await store.dispatch(fetchWeather());

    const state = store.getState().weather;
    expect(state.status).toBe('succeeded');
    expect(state.value).toBe(123);
  });

  it('fetchWeather thunk failure', async () => {
    jest.spyOn(api, 'getWeather').mockRejectedValue(new Error('fail'));

    const store = createTestStore();
    await store.dispatch(fetchWeather());

    const state = store.getState().weather;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('fail');
  });
});
