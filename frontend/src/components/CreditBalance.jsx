import { useCallback, useEffect, useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const CreditBalance = () => {
    const { getCredits, getAVBalance, depositCredits, account, isReady, connectWallet } = useWeb3();
    const [credits, setCredits] = useState('0');
    const [avBalance, setAvBalance] = useState('0');
    const [amount, setAmount] = useState('0.05');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const refresh = useCallback(async () => {
        if (!isReady || !account) return;
        setFetching(true);
        try {
            const [cred, av] = await Promise.all([getCredits(), getAVBalance()]);
            setCredits(cred);
            setAvBalance(av);
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    }, [isReady, account, getCredits, getAVBalance]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleDeposit = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) return;
        setLoading(true);
        try {
            const success = await depositCredits(amount);
            if (success) await refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isReady || !account) {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">Credit Balance</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Available Credits</p>
                        <p className="text-3xl font-bold text-cyan-400">--</p>
                    </div>
                    <button
                        onClick={connectWallet}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-semibold hover:opacity-90 transition-all"
                    >
                        Connect Wallet
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Connect your wallet to view credits.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Credit Balance</h2>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm">Available Credits</p>
                    <p className="text-3xl font-bold text-cyan-400">
                        {fetching ? "..." : `${Number(credits).toFixed(4)} AV`}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Wallet: {fetching ? "..." : `${Number(avBalance).toFixed(2)} AV`}</p>
                </div>
                <button
                    onClick={handleDeposit}
                    disabled={loading || !isReady}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Top Up"}
                </button>
            </div>

            <div className="mt-4 flex gap-2">
                <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500/50 outline-none"
                    placeholder="0.05"
                />
                <div className="flex gap-1">
                    {['0.01', '0.05', '0.10'].map((val) => (
                        <button
                            key={val}
                            onClick={() => setAmount(val)}
                            className={`px-2 rounded-lg border text-[10px] font-bold ${amount === val ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-black/20 border-white/10 text-gray-400 hover:border-gray-500'}`}
                        >
                            {val}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
                Deposit $AV to earn credits. Unlocking your score costs <span className="text-cyan-400 font-bold">0.01 AV</span>.
            </p>
        </div>
    );
};

export default CreditBalance;
