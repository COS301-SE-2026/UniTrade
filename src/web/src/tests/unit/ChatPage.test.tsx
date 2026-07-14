import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, it} from 'vitest';
import ChatPage from '../../pages/chat/ChatPage';
import { beforeEach } from 'vitest';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
vi.mock('../../hooks/useReservationRealtime', () => ({
    useReservationRealtime: vi.fn(),
}));

vi.mock('../../services/realtime/connectionManager', () => ({
    connectionManager: {
        getState: vi.fn(() => 'Connected'),
        onStateChange: vi.fn(() => () => {}),
        markRead: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('../../hooks/useChatMessages', () => ({
    useChatMessages: vi.fn(() => ({
        data: [],
        isLoading: false,
        isError: false,
    })),
}));

vi.mock('../../hooks/useSendMessage', () => ({
    useSendMessage: vi.fn(() => ({
        mutate: vi.fn(),
        retry: vi.fn()
    })),
}));

vi.mock('../../services/reservationService', () => ({
    getReservationById: vi.fn().mockResolvedValue({
        success: true,
    data: { reservationId: '123', listingId: 'listing-1'},
    }),
}));

vi.mock('../../services/listingsService', () => ({
    listingsService: {
        getById: vi.fn().mockResolvedValue({
            id: 'listing-1',
            title: 'Test Listing',
            price: 100,
            images: [],
        }),
    },
}));
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/buyer/messages/123']}>
        <Routes>
          <Route path="/buyer/messages/:reservationId" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

it('page renders without crashing or lagging', async () => {
    renderWithProviders(<ChatPage />);
    await screen.findByPlaceholderText('Type a message...');
})