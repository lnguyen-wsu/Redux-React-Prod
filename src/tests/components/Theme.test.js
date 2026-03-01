import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { Theme } from '../../components';

describe('Theme component', () => {
  it('renders customization UI', () => {
    render(
      <Provider store={store}>
        <Theme />
      </Provider>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(/apply color/i)).toBeInTheDocument();
  });
});
