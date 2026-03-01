import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from '../App';
import { store } from '../store';

test('renders profile and login components without errors', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  // at least one profile heading should exist
  const profileHeading = screen.getByText(/profile/i);
  expect(profileHeading).toBeInTheDocument();
});
