import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { Theme } from '../../components';

describe('Theme component', () => {
  it('renders input and update button', () => {
    render(
      <Provider store={store}>
        <Theme />
      </Provider>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(/update/i)).toBeInTheDocument();
  });
});