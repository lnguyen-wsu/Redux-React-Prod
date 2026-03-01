import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { Login } from '../../components';

describe('Login component', () => {
  it('renders login and logout buttons', () => {
    render(
      <Provider store={store}>
        <Login />
      </Provider>
    );
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/log out/i)).toBeInTheDocument();
  });
});