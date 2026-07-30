import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EnterPin from '../../pages/payment/EnterPin';
import { verifyPin } from '../../services/reservationService';


interface EnterPinLocationState {
  reservationId?: string;
}

const mockNavigate = vi.fn();
let locationState: EnterPinLocationState = { reservationId: 'r123' };

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: locationState }),
  };
});

vi.mock('../../services/reservationService', () => ({
  verifyPin: vi.fn(),
}));

const getByTextContent = (text: string) =>
  screen.getByText((_, el) => el?.textContent === text);

describe('EnterPin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    locationState = { reservationId: 'r123' };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <EnterPin />
      </MemoryRouter>
    );

  const paste = (input: HTMLElement, text: string) => {
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => text,
      },
    });
  };

  it('shows fallback when no reservationId in state', () => {
    locationState = {};
    render(
      <MemoryRouter>
        <EnterPin />
      </MemoryRouter>
    );
    expect(screen.getByText(/no reservation specified/i)).toBeInTheDocument();
  });

  it('renders 6 input fields and heading', () => {
    renderComponent();
    expect(screen.getByText('PIN Verification')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('allows entering digits and moves focus automatically', () => {
    renderComponent();
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(inputs[0].value).toBe('1');
    expect(inputs[1]).toHaveFocus();
    fireEvent.change(inputs[1], { target: { value: '2' } });
    expect(inputs[1].value).toBe('2');
    expect(inputs[2]).toHaveFocus();
  });

  it('does not allow non-numeric characters', () => {
    renderComponent();
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect(inputs[0].value).toBe('');
  });

  it('handles backspace to jump to previous input', () => {
    renderComponent();
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });
    expect(inputs[0]).toHaveFocus();
    fireEvent.keyDown(inputs[0], { key: 'Backspace' });
    expect(inputs[0]).toHaveFocus();
  });

  it('handles paste event for full 6-digit PIN', () => {
    renderComponent();
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    paste(inputs[0], '123456');
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');
    expect(inputs[2].value).toBe('3');
    expect(inputs[3].value).toBe('4');
    expect(inputs[4].value).toBe('5');
    expect(inputs[5].value).toBe('6');
    expect(inputs[5]).toHaveFocus();
  });

  it('paste with less than 6 digits fills the first few fields ', () => {
    renderComponent();
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    paste(inputs[0], '12');
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');
    expect(inputs[2].value).toBe('');
    expect(inputs[5].value).toBe('');
    expect(inputs[2]).toHaveFocus();
  });

  it('paste with more than 6 digits truncates and reset fosuc to the 6th input field ', () => {
    renderComponent();
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    paste(inputs[0], '123456789');
    expect(inputs[0].value).toBe('1');
    expect(inputs[5].value).toBe('6');
    expect(inputs[5]).toHaveFocus();
  });

  it('enables Verify PIN button when the entire input field covered', () => {
    renderComponent();
    const verifyBtn = screen.getByRole('button', { name: /verify pin/i });
    expect(verifyBtn).toBeDisabled();

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    for (let i = 0; i < 5; i++) {
      fireEvent.change(inputs[i], { target: { value: String(i + 1) } });
    }
    expect(verifyBtn).toBeDisabled();
    fireEvent.change(inputs[5], { target: { value: '6' } });
    expect(verifyBtn).toBeEnabled();
  });

  it('calls verifyPin and navigates when verified successfully', async () => {
    vi.mocked(verifyPin).mockResolvedValue({ success: true, data: undefined });
    renderComponent();
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: String(i + 1) } });
    }
    const verifyBtn = screen.getByRole('button', { name: /verify pin/i });
    fireEvent.click(verifyBtn);

    expect(verifyPin).toHaveBeenCalledWith('r123', '123456');
    expect(screen.getByRole('button', { name: /verifying.../i })).toBeDisabled();

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      '/payment/payment-complete?reservationId=r123&role=buyer'
    );
  });

  it('shows error and clears fields when the verification fails', async () => {
    vi.mocked(verifyPin).mockResolvedValue({
      success: false,
      error: { code: 'wrong_pin', message: 'Wrong PIN', status: 400 },
    });
    renderComponent();
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: '9' } });
    }
    fireEvent.click(screen.getByRole('button', { name: /verify pin/i }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText(/incorrect pin/i)).toBeInTheDocument();
    expect(inputs[0].value).toBe('');
    expect(inputs[5].value).toBe('');
  });

  it('shows too_many_attempts error and clears fields', async () => {
    vi.mocked(verifyPin).mockResolvedValue({
      success: false,
      error: { code: 'too_many_attempts', message: 'Too many', status: 429 },
    });
    renderComponent();
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: '1' } });
    }
    fireEvent.click(screen.getByRole('button', { name: /verify pin/i }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText(/too many incorrect attempts/i)).toBeInTheDocument();
    expect(inputs[0].value).toBe('');
  });

  it('countdown timer ticks and shows remaining time', async () => {
    renderComponent();
    expect(getByTextContent('00:59s')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(getByTextContent('00:57s')).toBeInTheDocument();
  });
});