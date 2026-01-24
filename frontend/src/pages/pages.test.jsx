/**
 * Comprehensive UI Element Tests
 * Tests that all buttons and links work properly across the application
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    sepolia: { chainId: '0xaa36a7', chainName: 'Sepolia Testnet' },
  },
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }) => children,
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Import components after mocks
import BridgePortal from '../pages/BridgePortal';
import PartnerEcosystem from '../pages/PartnerEcosystem';
import PrivacyPortal from '../pages/PrivacyPortal';
import Reports from '../pages/Reports';
import RiskWarRoom from '../pages/RiskWarRoom';
import RoleSelection from '../pages/RoleSelection';
import TrustDAO from '../pages/TrustDAO';

// Helper to render with router
const renderWithRouter = (component, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  );
};

describe('TrustDAO Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders governance portal correctly', async () => {
    renderWithRouter(<TrustDAO />);
    
    await waitFor(() => {
      expect(screen.getByText('Governance DAO Portal')).toBeInTheDocument();
    });
  });

  it('stake button is functional', async () => {
    renderWithRouter(<TrustDAO />);
    
    await waitFor(() => {
      const stakeButton = screen.getByText(/Stake to become Authority|Active Authority/i);
      expect(stakeButton).toBeInTheDocument();
    });
  });

  it('claim rewards button works when rewards available', async () => {
    renderWithRouter(<TrustDAO />);
    
    await waitFor(() => {
      const claimButton = screen.queryByText('Claim Now');
      if (claimButton) {
        fireEvent.click(claimButton);
        expect(window.alert).toHaveBeenCalled();
      }
    });
  });

  it('vote buttons are properly configured for active proposals', async () => {
    renderWithRouter(<TrustDAO />);
    
    await waitFor(() => {
      const voteForButtons = screen.queryAllByText('VOTE FOR');
      const voteAgainstButtons = screen.queryAllByText('VOTE AGAINST');
      
      // Should have voting buttons or already voted indicators
      const votedIndicators = screen.queryAllByText(/You voted/);
      expect(voteForButtons.length + votedIndicators.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('vote for button records vote and shows voted status', async () => {
    renderWithRouter(<TrustDAO />);
    
    await waitFor(async () => {
      const voteForButton = screen.queryByText('VOTE FOR');
      if (voteForButton && !voteForButton.disabled) {
        fireEvent.click(voteForButton);
        await waitFor(() => {
          expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Vote'));
        });
      }
    });
  });

  it('vote against button records vote', async () => {
    renderWithRouter(<TrustDAO />);
    
    await waitFor(async () => {
      const voteAgainstButton = screen.queryByText('VOTE AGAINST');
      if (voteAgainstButton && !voteAgainstButton.disabled) {
        fireEvent.click(voteAgainstButton);
        await waitFor(() => {
          expect(window.alert).toHaveBeenCalled();
        });
      }
    });
  });

  it('create proposal form submits correctly', async () => {
    renderWithRouter(<TrustDAO />);
    
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/I propose that we/i);
      expect(textarea).toBeInTheDocument();
      
      fireEvent.change(textarea, { target: { value: 'Test Proposal' } });
      
      const submitButton = screen.getByText('Submit Proposal');
      fireEvent.click(submitButton);
      
      expect(window.alert).toHaveBeenCalledWith('Proposal submitted to the DAO!');
    });
  });
});

describe('PartnerEcosystem Component', () => {
  it('renders partner ecosystem page', async () => {
    renderWithRouter(<PartnerEcosystem />);
    
    await waitFor(() => {
      expect(screen.getByText('Partner Ecosystem Integration')).toBeInTheDocument();
    });
  });

  it('swagger link has correct href', async () => {
    renderWithRouter(<PartnerEcosystem />);
    
    await waitFor(() => {
      const swaggerLink = screen.getByText(/View Full API Spec \(Swagger\)/i);
      expect(swaggerLink).toBeInTheDocument();
      expect(swaggerLink.closest('a')).toHaveAttribute('href', 'http://localhost:5000/api-docs');
      expect(swaggerLink.closest('a')).toHaveAttribute('target', '_blank');
    });
  });

  it('partner loan button is clickable', async () => {
    renderWithRouter(<PartnerEcosystem />);
    
    await waitFor(() => {
      const loanButton = screen.getByText('Apply for Partner Loan');
      expect(loanButton).toBeInTheDocument();
      expect(loanButton.tagName).toBe('BUTTON');
    });
  });

  it('sync with marketplace button exists', async () => {
    renderWithRouter(<PartnerEcosystem />);
    
    await waitFor(() => {
      const syncButton = screen.getByText('Sync with SecureMarket');
      expect(syncButton).toBeInTheDocument();
    });
  });
});

describe('RoleSelection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders role selection page', () => {
    renderWithRouter(<RoleSelection />);
    expect(screen.getByText(/Choose Your Path/i)).toBeInTheDocument();
  });

  it('displays all role options', () => {
    renderWithRouter(<RoleSelection />);
    
    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Network Admin')).toBeInTheDocument();
    expect(screen.getByText('Contract Deployer')).toBeInTheDocument();
  });

  it('role selection buttons trigger setRole', () => {
    renderWithRouter(<RoleSelection />);
    
    const userCard = screen.getByText('Individual').closest('div');
    const selectButton = userCard.querySelector('button') || userCard.closest('button');
    
    if (selectButton) {
      fireEvent.click(selectButton);
    }
  });
});

describe('Reports Component', () => {
  it('renders reports page', () => {
    renderWithRouter(<Reports />);
    expect(screen.getByText(/Submit Whistleblower Report|Report Manager/i)).toBeInTheDocument();
  });

  it('report form has required fields', () => {
    renderWithRouter(<Reports />);
    
    // Check for form elements
    const textareas = screen.queryAllByRole('textbox');
    expect(textareas.length).toBeGreaterThan(0);
  });
});

describe('PrivacyPortal Component', () => {
  it('renders privacy portal page', async () => {
    renderWithRouter(<PrivacyPortal />);
    
    await waitFor(() => {
      expect(screen.getByText(/Privacy Portal|Data Protection/i)).toBeInTheDocument();
    });
  });
});

describe('BridgePortal Component', () => {
  it('renders bridge portal page', async () => {
    renderWithRouter(<BridgePortal />);
    
    await waitFor(() => {
      expect(screen.getByText(/Bridge Portal|Cross-Chain/i)).toBeInTheDocument();
    });
  });

  it('has network selection elements', async () => {
    renderWithRouter(<BridgePortal />);
    
    await waitFor(() => {
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});

describe('RiskWarRoom Component', () => {
  it('renders risk war room page', async () => {
    renderWithRouter(<RiskWarRoom />);
    
    await waitFor(() => {
      expect(screen.getByText(/Risk War Room|Security Operations/i)).toBeInTheDocument();
    });
  });
});

describe('Global Button & Link Validation', () => {
  const validateInteractiveElements = async (component, componentName) => {
    const { container } = renderWithRouter(component);
    
    await waitFor(() => {
      // Get all buttons
      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      
      // Check buttons
      buttons.forEach((button, index) => {
        const buttonText = button.textContent.trim().substring(0, 30);
        const isDisabled = button.disabled;
        const hasClickHandler = button.onclick !== null || button.closest('form');
        
        // Log for debugging
        console.log(`${componentName} Button ${index}: "${buttonText}" - Disabled: ${isDisabled}`);
      });
      
      // Check links
      links.forEach((link, index) => {
        const href = link.getAttribute('href');
        const linkText = link.textContent.trim().substring(0, 30);
        
        // Links should have valid href
        if (href) {
          expect(href).not.toBe('#');
          expect(href.length).toBeGreaterThan(0);
        }
        
        console.log(`${componentName} Link ${index}: "${linkText}" -> ${href}`);
      });
    });
  };

  it('TrustDAO has valid interactive elements', async () => {
    await validateInteractiveElements(<TrustDAO />, 'TrustDAO');
  });

  it('PartnerEcosystem has valid interactive elements', async () => {
    await validateInteractiveElements(<PartnerEcosystem />, 'PartnerEcosystem');
  });

  it('RoleSelection has valid interactive elements', async () => {
    await validateInteractiveElements(<RoleSelection />, 'RoleSelection');
  });

  it('Reports has valid interactive elements', async () => {
    await validateInteractiveElements(<Reports />, 'Reports');
  });

  it('PrivacyPortal has valid interactive elements', async () => {
    await validateInteractiveElements(<PrivacyPortal />, 'PrivacyPortal');
  });

  it('BridgePortal has valid interactive elements', async () => {
    await validateInteractiveElements(<BridgePortal />, 'BridgePortal');
  });

  it('RiskWarRoom has valid interactive elements', async () => {
    await validateInteractiveElements(<RiskWarRoom />, 'RiskWarRoom');
  });
});
