import { render, screen } from "@testing-library/react";
import { MemoryRouter} from "react-router";
import { describe, it, expect, vi,beforeEach} from 'vitest'
import GeneratePin from "../../pages/payment/GeneratePin";

interface GeneratePinLocationState {
  pin?: string;
}
const mockNavigate = vi.fn();
let locationState: GeneratePinLocationState = { pin: '' };

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: locationState}),
    };
});

const renderComponent = ()  => {
    return render(
          <MemoryRouter>
        <GeneratePin />
      </MemoryRouter>
    );
}
describe('GeneratePin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        locationState = {};
    });

    it('shows fallback when pin is empty', () => {
        locationState = {};
        renderComponent();
        expect(screen.getByText(/no pin available/i)).toBeInTheDocument();
    });

    it('renders the actual pin digits when the pin is provided', () => {
        locationState = { pin: '123456'};
        renderComponent();
        
        expect(screen.getByText('Transaction PIN')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
    })

    it('pads short pins with empty spaces', () => {
        locationState = { pin: '12'};
        renderComponent();

        const containerss = document.querySelectorAll('.w-12.h-16');
        expect(containerss).toHaveLength(6);
        expect(containerss[0].textContent).toBe('1');
        expect(containerss[1].textContent).toBe('2');
        expect(containerss[2].textContent).toBe('');
        expect(containerss[5].textContent).toBe('');
    })

   // NOTE (FE) Add test for going to orders/ sales
});