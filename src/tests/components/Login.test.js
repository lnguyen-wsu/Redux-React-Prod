import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { Login } from '../../components';

describe('Login component', () => {
  it('renders authentication buttons', () => {
    render(
      <Provider store={store}>
        <Login />
      </Provider>
    );
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });
});
