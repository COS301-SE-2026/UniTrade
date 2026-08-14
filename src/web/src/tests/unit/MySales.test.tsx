import {render, screen,fireEvent} from '@testing-library/react' 
import { MemoryRouter} from 'react-router-dom'
import { beforeEach, expect,it,vi } from 'vitest'
import MySales from '../../pages/seller/MySales'
import { listingsService } from '../../services/listingsService'
import type { SaleItem } from '../../types/listing'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


const navigateMock = vi.fn();
vi.mock('react-router-dom', async () =>{
    const actual = await vi.importActual<typeof import ('react-router-dom')>
    ('react-router-dom');
    return {
        ...actual,
        useNavigate:() => navigateMock,
    }
})

vi.mock ('../../services/listingsService', () => ({
    listingsService: {
        getCompletedSales: vi.fn(),
    },
}))

vi.mock('../utils/formatters', () => ({
    formatPrice: (price: number) => `R${price}`,

}))

interface SummaryCardMockProps{
    label: string;
    value: string;
}

vi.mock('/../../pages/buyer/Reservation', () => ({
    SummaryCard: (props: SummaryCardMockProps) => (
        <div data-testid= "summary-card">
            <span> {props.label}</span>
            <span> {props.value}</span>
            </div>
    )
}))

interface ReviewModalMockProps{
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    revieweeName: string;
    revieweeLabel: string;
    onSubmitted:() => void;
}

vi.mock('.../../pages/auth/Review', () => ({
    ReviewModal: (props:ReviewModalMockProps) => 
        props.isOpen ? (
            <div data-testid="review-modal">
                <span> Rating {props.revieweeName} as {props.revieweeLabel}</span>
                <span> tx: {props.transactionId}</span>
                <button onClick ={props.onSubmitted}>Submit review</button>
                <button onClick={props.onClose}>Cancel review</button>
                </div>
        ) : null,
    }));

    function makeSale(overrides: Partial<SaleItem> = {} ): SaleItem {
        return {
            id: '1',
            transactionId: '11',
            refNum: 'REF441',
            title: 'Calculus Textbook',
            condition: 'Good', 
            buyerName: 'Langa Vakalisa',
            buyerInitials: 'LV',
            price: 250,
            status: 'Completed',
            rating: 0,
            _createdAtIso:'2026-07-24',
            imageUrl:'calculas-textbook.jpg',
            ...overrides,
        } as SaleItem;
    }

function renderMySales() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return render( 
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <MySales />
                </MemoryRouter>
        </QueryClientProvider>,

    )
}
    beforeEach(() => {
         vi.mocked(listingsService.getCompletedSales).mockReset();
         navigateMock.mockClear();
    })

    it('shows a loading message while fetching sales', () =>{
        vi.mocked(listingsService.getCompletedSales).mockReturnValue(new Promise(()=> {} ));

        renderMySales();
        expect(screen.getByText('Fetching sales...')).toBeInTheDocument();
    });

    it('shows an empty state when there are no completed sales', async() =>{
        vi.mocked(listingsService.getCompletedSales).mockResolvedValue([]);
        renderMySales()
        expect(await screen.findByText('No sales found')).toBeInTheDocument();
    })

    it('shows an errror message and retries on button click', async() =>{
        vi.mocked(listingsService.getCompletedSales).mockRejectedValueOnce(new Error('Network unavailable')).
        mockResolvedValueOnce([makeSale()]);
        renderMySales();
        expect(await screen.findByText('Network unavailable')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /retry/i}))

        expect(await screen.findByText('Calculus Textbook')).toBeInTheDocument();
    })
        it('falls back to a generic error message for a non-Error rejection', async () => {
    vi.mocked(listingsService.getCompletedSales).mockRejectedValueOnce('boom');

    renderMySales();
    expect(
        await screen.findByText('An error occured while loading your sales.'),
    ).toBeInTheDocument();
});

it('renders sale details and summary stats', async () => {
    vi.mocked(listingsService.getCompletedSales).mockResolvedValue([
        makeSale({ id: 'res-1',title:'Calculus Textbook', price: 250, rating: 0 }),
        makeSale({ id: 'res-2',title:'Physics Textbook', price: 150, rating: 5, buyerName: 'Sabira Karie' }),
    ]);

    renderMySales();

    expect(await screen.findByText('Calculus Textbook')).toBeInTheDocument();
    expect( screen.getByText('Physics Textbook')).toBeInTheDocument();
    expect(screen.getByText('Langa Vakalisa')).toBeInTheDocument();
    expect(screen.getByText('Sabira Karie')).toBeInTheDocument();
    expect(screen.getByText('2 sales made')).toBeInTheDocument();


    const summaryCards = screen.getAllByTestId('summary-card');
    expect(summaryCards).toHaveLength(3);
    expect(screen.getByText('R400')).toBeInTheDocument(); 
    expect(screen.getByText('1/2')).toBeInTheDocument(); 
});

it('shows singular "sale made" copy for exactly one sale', async () => {
    vi.mocked(listingsService.getCompletedSales).mockResolvedValue([makeSale()]);

    renderMySales();
    expect(await screen.findByText('1 sale made')).toBeInTheDocument();
});


