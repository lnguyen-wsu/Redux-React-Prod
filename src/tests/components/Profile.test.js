import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { Profile } from '../../components';

describe('Profile component', () => {
  it('renders profile heading', () => {
    render(
      <Provider store={store}>
        <Profile />
      </Provider>
    );
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
  });
});