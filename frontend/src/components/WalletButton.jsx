/**
 * Wallet Connection Button
 * Multi-wallet support with Web3Modal
 */
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useBalance } from 'wagmi';

const WALLET_ICONS = {
  'MetaMask': '🦊',
  'Coinbase Wallet': '🔵',
  'WalletConnect': '🔗',
  'Phantom': '👻',
  'Rainbow': '🌈',
  'Safe': '🔒',
  'default': '💼'
};

/**
 * Compact wallet button for navbar
 */
export function WalletButton() {
  const { open } = useWeb3Modal();
  const { address, isConnected, connector } = useAccount();
  const { data: balance } = useBalance({ address });

  const walletIcon = WALLET_ICONS[connector?.name] || WALLET_ICONS.default;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  if (!isConnected) {
    return (
      <button
        onClick={() => open()}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
      >
        <span>🔌</span>
        <span className="hidden sm:inline">Connect Wallet</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => open({ view: 'Account' })}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all"
    >
      <span className="text-lg">{walletIcon}</span>
      <div className="hidden sm:flex flex-col items-start">
        <span className="text-xs text-white font-medium">{shortAddress}</span>
        <span className="text-[10px] text-gray-400">
          {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : connector?.name}
        </span>
      </div>
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

/**
 * Large connect button for login/onboarding
 */
export function ConnectWalletCard({ onConnect }) {
  const { open } = useWeb3Modal();
  const { isConnected, connector } = useAccount();

  const handleConnect = async () => {
    if (isConnected && onConnect) {
      onConnect();
    } else {
      open();
    }
  };

  if (isConnected) {
    return (
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">{WALLET_ICONS[connector?.name] || '✓'}</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Wallet Connected</h3>
        <p className="text-sm text-gray-400 mb-4">
          Connected via {connector?.name || 'Wallet'}
        </p>
        <button
          onClick={handleConnect}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all"
        >
          Continue to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-4 text-center">Connect Your Wallet</h3>
      
      <button
        onClick={() => open()}
        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3"
      >
        <span className="text-xl">🔌</span>
        <span>Connect Wallet</span>
      </button>

      <div className="mt-6 pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center mb-4">Supported Wallets</p>
        <div className="flex justify-center gap-4">
          {Object.entries(WALLET_ICONS).filter(([k]) => k !== 'default').slice(0, 5).map(([name, icon]) => (
            <div key={name} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl mb-1">
                {icon}
              </div>
              <span className="text-[9px] text-gray-500">{name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Wallet selector grid for custom UI
 */
export function WalletGrid() {
  const { open } = useWeb3Modal();

  const wallets = [
    { id: 'metamask', name: 'MetaMask', icon: '🦊', color: 'from-orange-500 to-yellow-500' },
    { id: 'coinbase', name: 'Coinbase', icon: '🔵', color: 'from-blue-600 to-blue-400' },
    { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', color: 'from-blue-500 to-cyan-500' },
    { id: 'phantom', name: 'Phantom', icon: '👻', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {wallets.map((wallet) => (
        <button
          key={wallet.id}
          onClick={() => open()}
          className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl transition-all group"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${wallet.color} flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform`}>
            {wallet.icon}
          </div>
          <span className="text-sm text-white font-medium">{wallet.name}</span>
        </button>
      ))}
    </div>
  );
}

export default WalletButton;
