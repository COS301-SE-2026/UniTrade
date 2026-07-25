import { test, expect, vi,beforeAll, afterEach, afterAll } from 'vitest'
import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../../App'
import { useAuthStore } from '../../store/useAuthStore'
import { server } from '../mocks/server'
import { ToastProvider } from '../../components/layout/Toast'


beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})

afterAll(() => {
  server.close()
})

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
  },
}));

const renderWithProviders = (ui: React.ReactElement, { initialEntries = ['/'] } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {ui}
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

test('signup -> otp -> login -> logout', async () => {
  const user = userEvent.setup()


  renderWithProviders(<App />, { initialEntries: ['/auth/Signup'] })

  await screen.findByText('Get Started')

  await user.type(screen.getByPlaceholderText('First Name'), 'Tafadzwa')
  await user.type(screen.getByPlaceholderText('Last Name'), 'M')
  await user.type(screen.getByPlaceholderText('Email'), 'tafadzwa@tuks.co.za')

  await waitFor(() => {
    expect(screen.getByText('University of Pretoria')).toBeInTheDocument();
  }, { timeout: 3000 });

  await waitFor(() => {
  expect(screen.queryByText('fetch failed')).not.toBeInTheDocument();
}, { timeout: 2000 });

expect(screen.getByText('University of Pretoria')).toBeInTheDocument();

  await user.selectOptions(screen.getByRole('combobox'), 'University of Pretoria')

  await user.type(screen.getByPlaceholderText('Year of Study'), '2')
  await user.type(screen.getByPlaceholderText('Password'), 'Password123!')

  await user.click(screen.getByRole('button', { name: /signup/i }))

  await user.click(screen.getByRole('button', { name: /signup/i }));

await waitFor(() => {
  const errorEl = screen.queryByText(/went wrong|error/i);
  if (errorEl) {
    console.error('Signup error displayed:', errorEl.textContent);
  }
}, { timeout: 1000 });

await screen.findByText('OTP Verification', {}, { timeout: 2000 });

expect(useAuthStore.getState().pendingEmail).toBe('tafadzwa@tuks.co.za');

  const otpInputs = screen.getAllByRole('textbox')

  for (let i = 0; i < 6; i++) {
    await user.type(otpInputs[i], String(i + 1))
  }
  await user.click(screen.getByRole('button', { name: /verify otp/i }))

  await screen.findByText('Welcome Back!')
  expect(useAuthStore.getState().pendingEmail).toBeNull()

  await user.type(screen.getByPlaceholderText('Email Address'), 'tafadzwa@tuks.co.za')
  await user.type(screen.getByPlaceholderText('Password'), 'Password123!')
  await user.click(screen.getByRole('button', { name: /^login$/i }))

  await waitFor(() => {
    expect(useAuthStore.getState().user).toMatchObject({
      name: 'Tafadzwa M',
      role: 'student',
    })
  })



  server.use(
    http.get('http://localhost:5000/api/auth/me', () => {
      return HttpResponse.json({
        user: {
          userId: 'user-1',
          firstName: 'Tafadzwa',
          lastName: 'M',
          userRole: 'student',
        },
      })
    })
  )

  const profileLink = await screen.findByRole('link', { name: /profile/i });
  await user.click(profileLink);
  await screen.findByText('Account Details');

  await screen.findByText(/Tafadzwa\s+M/i)



  await user.click(screen.getByRole('button', { name: /logout/i }))

  await waitFor(() => {
    expect(useAuthStore.getState().user).toBeNull()
  })
  await screen.findByText('Welcome Back!')
})