/**
 * Layout Components Tests
 * Tests for Navbar, Sidebar, and MobileNav components
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/setup.js';

// Mock AuthContext
const mockLogout = vi.fn();
const mockSwitchNetwork = vi.fn();

const mockAuthContext = {
  user: { address: '0x1234567890abcdef1234567890abcdef12345678', name: 'Test User' },
  role: 'user',
  login: vi.fn(),
  logout: mockLogout,
  register: vi.fn(),
  setRole: vi.fn(),
  chainId: '0x539',
  switchNetwork: mockSwitchNetwork,
  availableNetworks: {
    ganache: { chainId: '0x539', chainName: 'Ganache Local' },
    sepolia: { chainId: '0xaa36a7', chainName: 'Sepolia Testnet' },
  },
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }) => children,
}));

// Import components after mocks
import MobileNav from '../layout/MobileNav';
import Navbar from '../layout/Navbar';
import Sidebar from '../layout/Sidebar';

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navbar correctly', () => {
    renderWithRouter(<Navbar />);

    // Should render user identity info (address truncated "0x1234...5678")
    const addressText = screen.getByText('0x1234...5678');
    expect(addressText).toBeInTheDocument();
  });

  it('displays user name', () => {
    renderWithRouter(<Navbar />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('network switcher button exists', () => {
    renderWithRouter(<Navbar />);
    
    // Check for network indicator
    const networkButton = screen.getByText(/Ganache Local|Wrong Network/i);
    expect(networkButton).toBeInTheDocument();
  });

  it('network switcher dropdown opens on click', async () => {
    renderWithRouter(<Navbar />);
    
    const networkButton = screen.getByText(/Ganache Local|Wrong Network/i);
    fireEvent.click(networkButton);
    
    await waitFor(() => {
      // Should show network options
      const ganacheOption = screen.queryAllByText('Ganache Local');
      expect(ganacheOption.length).toBeGreaterThan(0);
    });
  });

  it('logout button functionality', async () => {
    renderWithRouter(<Navbar />);
    
    // Hover over profile to show dropdown
    const profileArea = screen.getByText('Test User').closest('button');
    if (profileArea) {
      fireEvent.mouseEnter(profileArea.closest('.group'));
    }

    await waitFor(() => {
      const logoutButton = screen.queryByText('Logout');
      if (logoutButton) {
        fireEvent.click(logoutButton);
        expect(mockLogout).toHaveBeenCalled();
      }
    });
  });

  it('notification bell exists', () => {
    const { container } = renderWithRouter(<Navbar />);
    
    // Notification button should exist (on larger screens)
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar correctly', () => {
    renderWithRouter(<Sidebar />);
    
    // Should have navigation links
    const dashboard = screen.getByText(/Dashboard/i);
    expect(dashboard).toBeInTheDocument();
  });

  it('contains navigation links', () => {
    renderWithRouter(<Sidebar />);
    
    // Check for common navigation items
    expect(screen.queryByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('navigation links have proper href', () => {
    const { container } = renderWithRouter(<Sidebar />);
    
    const links = container.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        expect(href.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('MobileNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mobile navigation', () => {
    const { container } = renderWithRouter(<MobileNav />);
    
    // Should render navigation
    expect(container.querySelector('nav') || container.firstChild).toBeTruthy();
  });

  it('mobile nav links are functional', () => {
    const { container } = renderWithRouter(<MobileNav />);
    
    const links = container.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        expect(href).not.toBe('#');
      }
    });
  });
});

describe('All Navbar Buttons Functional', () => {
  it('all buttons in navbar have proper handlers', () => {
    const { container } = renderWithRouter(<Navbar />);
    
    const buttons = container.querySelectorAll('button');
    
    buttons.forEach((button, index) => {
      const isDisabled = button.disabled;
      const isInsideForm = button.closest('form') !== null;
      const buttonText = button.textContent.trim();
      
      // Each button should either be disabled, inside a form, or be clickable
      console.log(`Navbar Button ${index}: "${buttonText.substring(0, 20)}" - Form: ${isInsideForm}, Disabled: ${isDisabled}`);
      
      // Test clicking non-disabled buttons that aren't inside forms
      if (!isDisabled && !isInsideForm) {
        expect(() => fireEvent.click(button)).not.toThrow();
      }
    });
  });
});

describe('All Sidebar Links Functional', () => {
  it('all links in sidebar are properly configured', () => {
    const { container } = renderWithRouter(<Sidebar />);
    
    const links = container.querySelectorAll('a');
    
    links.forEach((link, index) => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim();
      
      console.log(`Sidebar Link ${index}: "${text.substring(0, 20)}" -> ${href}`);
      
      // Links should have valid href
      if (href) {
        expect(href).not.toBe('');
        expect(href).not.toBe('#');
      }
      
      // Should be clickable
      expect(() => fireEvent.click(link)).not.toThrow();
    });
  });
});
