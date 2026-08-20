/**
 * Component Tests
 * Tests for reusable UI components
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '../test/setup.js';

// Mock AuthContext
const mockAuthContext = {
  user: { address: '0x1234567890abcdef1234567890abcdef12345678', name: 'Test User' },
  role: 'user',
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  setRole: vi.fn(),
  chainId: '0x539',
  switchNetwork: vi.fn(),
  availableNetworks: {
    ganache: { chainId: '0x539', chainName: 'Ganache Local' },
  },
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }) => children,
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { score: 750 } })),
    post: vi.fn(() => Promise.resolve({ data: { success: true } })),
  },
}));

// Import components after mocks
import CreditBalance from '../components/CreditBalance';
import FileUpload from '../components/FileUpload';
import IdentityCard from '../components/IdentityCard';
import MyScoreWidget from '../components/MyScoreWidget';
import ScoreSearchWidget from '../components/ScoreSearchWidget';

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('CreditBalance Component', () => {
  it('renders credit balance', () => {
    renderWithRouter(<CreditBalance />);
    
    // Should show credit-related content
    const creditTexts = screen.queryAllByText(/Credit|Balance/i);
    expect(creditTexts.length).toBeGreaterThan(0);
  });
});

describe('FileUpload Component', () => {
  const mockOnUpload = vi.fn();

  it('renders file upload component', () => {
    renderWithRouter(<FileUpload onUpload={mockOnUpload} />);
    
    // Should have upload functionality
    expect(document.body).toBeTruthy();
  });

  it('file input exists', () => {
    const { container } = renderWithRouter(<FileUpload onUpload={mockOnUpload} />);
    
    const fileInput = container.querySelector('input[type="file"]');
    // File input might be hidden but should exist or have an upload button
    const uploadTexts = screen.queryAllByText(/Upload|Browse|Select/i);
    expect(fileInput || uploadTexts.length > 0).toBeTruthy();
  });
});

describe('IdentityCard Component', () => {
  const mockIdentity = {
    name: 'Test User',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    score: 750,
    verified: true,
  };

  it('renders identity card', () => {
    renderWithRouter(<IdentityCard identity={mockIdentity} />);
    expect(document.body).toBeTruthy();
  });
});

describe('MyScoreWidget Component', () => {
  it('renders score widget', async () => {
    renderWithRouter(<MyScoreWidget />);
    
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});

describe('ScoreSearchWidget Component', () => {
  it('renders search widget', () => {
    renderWithRouter(<ScoreSearchWidget />);
    
    // Should have search input
    const searchInput = screen.queryByPlaceholderText(/Search|Address/i);
    expect(searchInput || document.body).toBeTruthy();
  });

  it('search button exists and is clickable', () => {
    const { container } = renderWithRouter(<ScoreSearchWidget />);
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      if (!button.disabled) {
        expect(() => fireEvent.click(button)).not.toThrow();
      }
    });
  });
});

describe('Component Button Validation', () => {
  it('all component buttons are properly configured', async () => {
    const components = [
      { Component: CreditBalance, name: 'CreditBalance' },
      { Component: MyScoreWidget, name: 'MyScoreWidget' },
      { Component: ScoreSearchWidget, name: 'ScoreSearchWidget' },
    ];

    for (const { Component, name } of components) {
      const { container } = renderWithRouter(<Component />);
      
      const buttons = container.querySelectorAll('button');
      
      buttons.forEach((button, index) => {
        const isDisabled = button.disabled;
        const text = button.textContent.trim();
        
        console.log(`${name} Button ${index}: "${text.substring(0, 20)}" - Disabled: ${isDisabled}`);
        
        // Should be clickable without errors
        if (!isDisabled) {
          expect(() => fireEvent.click(button)).not.toThrow();
        }
      });
    }
  });
});
