import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ScoreSearchWidget from '../ScoreSearchWidget';

// Mocks
const mockUseAuth = vi.fn(() => ({ token: 'mock-jwt-token' }));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => mockUseAuth()
}));

const mockUseWeb3 = vi.fn();

vi.mock('../../hooks/useWeb3', () => ({
    useWeb3: () => mockUseWeb3()
}));

const connectedWeb3 = () => ({
    account: '0xTestAccount123',
    isReady: true,
    connectWallet: vi.fn(),
    getCredits: vi.fn().mockResolvedValue(10), // Sufficient credits
    getEthBalance: vi.fn().mockResolvedValue('1.0'),
    viewPrivateScore: vi.fn().mockResolvedValue(true),
    submitRangeProof: vi.fn().mockResolvedValue(true)
});

// Mock fetch for delegated proof / score lookup
global.fetch = vi.fn();

describe('ScoreSearchWidget', () => {

    it('shows a connect wallet prompt when no account is connected', () => {
        mockUseWeb3.mockReturnValue({ account: undefined, isReady: false, connectWallet: vi.fn() });
        render(<ScoreSearchWidget />);

        expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
    });

    it('renders the search form when an account is connected', async () => {
        mockUseWeb3.mockReturnValue(connectedWeb3());
        render(<ScoreSearchWidget />);

        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText(/Enter wallet address/i);
            expect(searchInput).toBeInTheDocument();
        });
    });

    it('searches a score and displays the decrypted value', async () => {
        mockUseWeb3.mockReturnValue(connectedWeb3());
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ score: 750 })
        });

        render(<ScoreSearchWidget />);

        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText(/Enter wallet address/i);
            fireEvent.change(searchInput, { target: { value: '0x1234' } });
            fireEvent.click(screen.getByText(/Search & Pay/i));
        });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/admin/score/0x1234');
            expect(screen.getByText('0.75')).toBeInTheDocument();
        });
    });

    it('shows an error when the score lookup fails', async () => {
        mockUseWeb3.mockReturnValue(connectedWeb3());
        fetch.mockResolvedValueOnce({
            ok: false
        });

        render(<ScoreSearchWidget />);

        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText(/Enter wallet address/i);
            fireEvent.change(searchInput, { target: { value: '0x1234' } });
            fireEvent.click(screen.getByText(/Search & Pay/i));
        });

        await waitFor(() => {
            expect(screen.getByText(/Failed to fetch decrypted score from backend/i)).toBeInTheDocument();
        });
    });
});
