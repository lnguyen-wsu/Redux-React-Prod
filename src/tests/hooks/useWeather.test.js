import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { useWeather } from '../../hooks';

function Dummy() {
  const { weather, status } = useWeather();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="weather">{weather}</span>
    </div>
  );
}

describe('useWeather hook', () => {
  it('returns initial state', () => {
    render(
      <Provider store={store}>
        <Dummy />
      </Provider>
    );
    // Note: status may be 'idle' or 'loading' depending on thunk dispatch timing
    const status = screen.getByTestId('status').textContent;
    expect(['idle', 'loading']).toContain(status);
  });
});