import { test, expect, vi, afterEach } from 'vitest';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';
import { useAuthStore } from '../../store/useAuthStore';
import { server } from '../mocks/server';
import { ToastProvider } from '../../components/layout/Toast';
//import { fireEvent } from '@testing-library/react';

afterEach(() => {
  vi.clearAllMocks();
});

vi.mock('../../config', () => ({
  loadConfig: vi.fn(() => Promise.resolve()),
  getApiUrl: vi.fn(() => 'http://localhost:5000'),
}));

vi.mock('../../services/fcmService', () => ({
  registerForPushN: vi.fn().mockResolvedValue(true),
  onForegroundMessage: vi.fn(() => vi.fn()),
}));

vi.mock('../../services/realtime/connectionManager', () => ({
  connectionManager: {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    onMessageReceived: vi.fn(() => vi.fn()),
    onReconnected: vi.fn(() => vi.fn()),
    onMessagesRead: vi.fn(() => vi.fn()),
    onReservationUpdated: vi.fn(() => vi.fn()),
    onListingChanged: vi.fn(() => vi.fn()),
    onDisputeCreated: vi.fn(() => vi.fn()),
    onDisputeResolved: vi.fn(() => vi.fn()),
    onSavedSearchMatch: vi.fn(() => vi.fn())
  },
}));

const renderWithProviders = (ui: React.ReactElement, { initialEntries = ['/'] } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {ui}
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};


/*test('signup -> otp -> lands on proof of registration upload', async () => {
  const user = userEvent.setup();

  server.use(
    http.post('auth/register', async () => {
      useAuthStore.setState({ pendingEmail: 'tafadzwa@tuks.co.za' });
      return HttpResponse.json({
        message: 'OTP sent to email',
        pendingEmail: 'tafadzwa@tuks.co.za',
      });
    }),
    http.post('auth/verify-otp', async () => {
      useAuthStore.setState({ pendingEmail: null });
      return HttpResponse.json({
        token: 'fake-token',
        user: {
          userId: 'user-1',
          firstName: 'Tafadzwa',
          lastName: 'M',
          userRole: 'student',
          isVerified: false,
        },
      });
    })
  );

  const { container } = renderWithProviders(<App />, { initialEntries: ['/auth/Signup'] });

  await screen.findByText(/get started/i);

  await user.type(screen.getByPlaceholderText(/first name/i), 'Tafadzwa');
  await user.type(screen.getByPlaceholderText(/last name/i), 'M');
  await user.type(screen.getByPlaceholderText(/student email/i), 'tafadzwa@tuks.co.za');

  const selectEl = screen.getByRole('combobox');
  fireEvent.change(selectEl, { target: { value: 'University of Pretoria' } });

  await user.type(screen.getByPlaceholderText(/degree program/i), 'BSc Computer Science');
  await user.type(screen.getByPlaceholderText(/year of study/i), '3');
  await user.type(screen.getByPlaceholderText(/password/i), 'Password123!');

  const form = container.querySelector('form');
  if (form) {
    fireEvent.submit(form);
  } else {
    await user.click(screen.getByRole('button', { name: /^signup$/i }));
  }

  const termsHeading = await screen.findByRole(
    'heading',
    { name: /terms/i },
    { timeout: 3000 }
  ).catch(() => null);

  if (termsHeading) {
    const checkbox = await screen.findByRole('checkbox');
    await user.click(checkbox);
    const acceptBtn = screen.getByRole('button', { name: /accept|continue/i });
    await user.click(acceptBtn);
  }

  await screen.findByText(/otp verification/i, {}, { timeout: 10000 });
  expect(useAuthStore.getState().pendingEmail).toBe('tafadzwa@tuks.co.za');

  const otpInputs = await screen.findAllByRole('textbox');
  for (let i = 0; i < otpInputs.length; i++) {
    await user.type(otpInputs[i], String(i + 1));
  }
  await user.click(screen.getByRole('button', { name: /verify otp/i }));

  await screen.findByText(/proof of registration upload/i);
});*/

test('login -> profile -> logout', async () => {
  useAuthStore.setState({ user: null, pendingEmail: null, viewMode: 'buyer' });

  const user = userEvent.setup();

  server.use(
    http.post('http://localhost:5000/auth/login', () => {
      return HttpResponse.json({
        token: 'fake-token',
        user: {
          userId: 'user-1',
          firstName: 'Tafadzwa',
          lastName: 'M',
          userRole: 'student',
        },
      });
    }),

    http.get('http://localhost:5000/auth/me', () => {
      return HttpResponse.json({
        user: {
          userId: 'user-1',
          firstName: 'Tafadzwa',
          lastName: 'M',
          userRole: 'student',
        },
      });
    })
  );
  renderWithProviders(<App />, { initialEntries: ['/auth/Login'] });

  await screen.findByText('Welcome Back!');

  await user.type(screen.getByPlaceholderText(/email/i), 'tafadzwa@tuks.co.za');
  await user.type(screen.getByPlaceholderText(/password/i), 'Password123!');
  await user.click(screen.getByRole('button', { name: /^login$/i }));

  const profileLink = await screen.findByRole('link', { name: /profile/i });
  await user.click(profileLink);
  await screen.findByText('Account Details');

  await screen.findByText(/Tafadzwa\s+M/i);

  await user.click(screen.getByRole('button', { name: /logout/i }));

  await waitFor(() => {
    expect(useAuthStore.getState().user).toBeNull();
  });
  await screen.findByText('Welcome Back!');
});
