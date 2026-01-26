import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ScoreSearchWidget from '../components/ScoreSearchWidget';

// Mocks
vi.mock('../context/AuthContext', () => ({
    default: () => ({
        token: 'mock-jwt-token'
    })
}));

vi.mock('../hooks/useWeb3', () => ({
    useWeb3: () => ({
        account: '0xTestAccount123',
        isReady: true,
        connectWallet: vi.fn(),
        getCredits: vi.fn().mockResolvedValue(10).mockReturnValue(10), // Sufficient credits
        viewPrivateScore: vi.fn(),
        submitRangeProof: vi.fn().mockResolvedValue(true)
    })
}));

// Mock fetch for Delegated Proof
global.fetch = vi.fn();

describe('ScoreSearchWidget ZK Features', () => {

    it('renders the "Verify My Score" button when account is connected', () => {
        render(<ScoreSearchWidget />);
        
        const verifyBtn = screen.getByText(/Verify My Score/i);
        expect(verifyBtn).toBeDefined();
    });

    it('triggers ZK proof flow when verify button is clicked', async () => {
        // Mock success response from backend
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ 
                success: true, 
                pi_a: ['1','2'], 
                pi_b: [['1','2'],['3','4']], 
                pi_c: ['5','6'] 
            })
        });

        render(<ScoreSearchWidget />);
        
        const verifyBtn = screen.getByText(/Verify My Score/i);
        fireEvent.click(verifyBtn);

        // Check button loading state text
        expect(screen.getByText(/Proving.../i)).toBeDefined();

        await waitFor(() => {
            // Check if backend was called
            expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/admin/proof', expect.anything());
            
            // Check success message
            expect(screen.getByText(/ZK Proof Verified/i)).toBeDefined();
        });
    });

    it('shows error message if backend proof generation fails', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ 
                success: false, 
                error: "Backend Error: Secret not found" 
            })
        });

        render(<ScoreSearchWidget />);
        
        const verifyBtn = screen.getByText(/Verify My Score/i);
        fireEvent.click(verifyBtn);

        await waitFor(() => {
             expect(screen.getByText(/ZK Verification Failed/i)).toBeDefined();
        });
    });
});
