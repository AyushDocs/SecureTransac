import { useCallback, useEffect, useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const CreditManager = () => {
    const { getCredits, depositCredits, account, isReady } = useWeb3();
    const [balance, setBalance] = useState('0');
    const [amount, setAmount] = useState('0.05');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const refreshBalance = useCallback(async () => {
        if (!isReady || !account) return;
        setFetching(true);
        try {
            const bal = await getCredits();
            setBalance(bal);
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    }, [isReady, account, getCredits]);

    useEffect(() => {
        refreshBalance();
    }, [refreshBalance]);

    const handleDeposit = async () => {
        if (!amount || isNaN(amount)) return;
        setLoading(true);
        try {
            const success = await depositCredits(amount);
            if (success) {
                await refreshBalance();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-xl">💳</span> Reputation Credits
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                        Required to view private scores and request verifications.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Balance</div>
                    <div className="text-xl font-mono font-black text-cyan-400">
                        {fetching ? "..." : `${balance} AV`}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block ml-1">Top-up Amount (AV)</label>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                            placeholder="0.05"
                        />
                        <button 
                            onClick={handleDeposit}
                            disabled={loading || !isReady}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg text-xs uppercase transition-all"
                        >
                            {loading ? "Processing..." : "Deposit"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {['0.01', '0.05', '0.10'].map(val => (
                        <button 
                            key={val}
                            onClick={() => setAmount(val)}
                            className={`py-1 rounded border text-[10px] font-bold ${amount === val ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'}`}
                        >
                            {val} AV
                        </button>
                    ))}
                </div>

                <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                    <p className="text-[10px] text-blue-300 leading-relaxed italic">
                        Note: 1 Credit = 1 wei of $AV. Viewing a score costs 0.01 AV. 
                        $AV is held in the TrustRegistry smart contract.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreditManager;
