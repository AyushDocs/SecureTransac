/**
 * Test Utilities
 * Provides common test helpers and mock providers
 */
import { render } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Mock user data
export const mockUser = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  name: 'Test User',
  role: 'user',
};

export const mockAdminUser = {
  address: '0xADMIN567890abcdef1234567890abcdef12345678',
  name: 'Admin User',
  role: 'admin',
};

export const mockCompanyUser = {
  address: '0xCOMPANY7890abcdef1234567890abcdef12345678',
  name: 'Company User',
  role: 'company',
};

// Mock AuthContext value
export const createMockAuthContext = (overrides = {}) => ({
  user: mockUser,
  role: 'user',
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  setRole: vi.fn(),
  chainId: '0x539',
  switchNetwork: vi.fn(),
  availableNetworks: {
    ganache: { chainId: '0x539', chainName: 'Ganache Local' },
    sepolia: { chainId: '0xaa36a7', chainName: 'Sepolia Testnet' },
  },
  ...overrides,
});

// Test Wrapper with all providers
export const TestWrapper = ({ children }) => {
  return (
    <HashRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </HashRouter>
  );
};

// Custom render with providers
export const renderWithProviders = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options });
};

// Helper to get all interactive elements
export const getInteractiveElements = (container) => {
  const buttons = container.querySelectorAll('button');
  const links = container.querySelectorAll('a');
  const inputs = container.querySelectorAll('input');
  const selects = container.querySelectorAll('select');
  const textareas = container.querySelectorAll('textarea');
  
  return {
    buttons: Array.from(buttons),
    links: Array.from(links),
    inputs: Array.from(inputs),
    selects: Array.from(selects),
    textareas: Array.from(textareas),
    all: [
      ...Array.from(buttons),
      ...Array.from(links),
      ...Array.from(inputs),
      ...Array.from(selects),
      ...Array.from(textareas),
    ],
  };
};

// Helper to check if element is properly configured
export const isButtonProperlyConfigured = (button) => {
  // Check if button has onClick or is inside a form
  const hasOnClick = button.onclick !== null || button.getAttribute('onClick') !== null;
  const isInsideForm = button.closest('form') !== null;
  const isSubmitType = button.type === 'submit';
  const isDisabled = button.disabled;
  
  // Valid if button is disabled, has onclick, or is a submit button in a form
  return isDisabled || hasOnClick || (isInsideForm && isSubmitType);
};

// Helper to check if link is properly configured
export const isLinkProperlyConfigured = (link) => {
  const href = link.getAttribute('href');
  const hasOnClick = link.onclick !== null;
  
  // Link should have href or onClick
  return (href && href !== '#' && href !== '') || hasOnClick;
};
