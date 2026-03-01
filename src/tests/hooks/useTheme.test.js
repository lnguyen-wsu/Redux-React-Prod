import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { useTheme } from '../../hooks';

function Dummy() {
  const { color, setColor } = useTheme();
  return (
    <div>
      <span data-testid="color">{color}</span>
      <button onClick={() => setColor('red')}>change</button>
    </div>
  );
}

describe('useTheme hook', () => {
  it('returns color and setter', () => {
    render(
      <Provider store={store}>
        <Dummy />
      </Provider>
    );
    expect(screen.getByTestId('color').textContent).toBe('');
  });
});