import { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import RegistryArtifact from "../contracts/TrustRegistry.json";

export function useWeb3() {
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);
                
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    console.log(`[useWeb3] eth_accounts result: ${accounts}`);
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    } else if (window.ethereum.selectedAddress) {
                         console.log(`[useWeb3] Using selectedAddress fallback: ${window.ethereum.selectedAddress}`);
                         setAccount(window.ethereum.selectedAddress);
                    }

                    const networkId = await web3Instance.eth.net.getId();
                    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                    setChainId(chainIdHex);
                    console.log(`[useWeb3] Detected Network ID: ${networkId}, Chain ID: ${chainIdHex}`);
                    
                    // Handle BigInt networkId
                    const netId = typeof networkId === 'bigint' ? Number(networkId) : networkId;
                    
                    // Ganache 1337 vs 5777 mapping fix
                    let deployedNetwork = RegistryArtifact.networks[netId];
                    if (!deployedNetwork && netId === 1337) {
                         deployedNetwork = RegistryArtifact.networks[5777];
                    }
                    
                    if (deployedNetwork && deployedNetwork.address) {
                        const code = await web3Instance.eth.getCode(deployedNetwork.address);
                        if (code === '0x' || code === '0x0') {
                            console.error(`[useWeb3] Contract address found (${deployedNetwork.address}) but NO bytecode. Contract not deployed?`);
                            alert(`Contract detection failed: No bytecode at ${deployedNetwork.address}. Did you forget to 'truffle migrate'?`);
                        } else {
                            const instance = new web3Instance.eth.Contract(
                                RegistryArtifact.abi,
                                deployedNetwork.address,
                            );
                            setContract(instance);
                            setIsReady(true);
                            console.log(`[useWeb3] Contract loaded at ${deployedNetwork.address}`);
                        }
                    } else {
                        console.warn("Contract not deployed to detected network.");
                    }

                    // Listen for account changes
                    window.ethereum.on('accountsChanged', (newAccounts) => {
                        console.log('[Web3] Account changed:', newAccounts[0]);
                        setAccount(newAccounts[0]);
                        // Removed reload - state update is sufficient
                    });

                    window.ethereum.on('chainChanged', (newChainId) => {
                        console.log('[Web3] Chain changed:', newChainId);
                        setChainId(newChainId);
                        // Removed reload - state update triggers re-render
                    });

                } catch (error) {
                    console.error("Failed to load web3", error);
                }
            }
        };

        init();
    }, []);

    const depositCredits = useCallback(async (amountEth) => {
        if (!contract || !account) return;
        try {
            const amountString = typeof amountEth === 'number' ? amountEth.toString() : amountEth;
            const weiValue = Web3.utils.toWei(amountString, "ether");
            console.log(`[Web3] Depositing ${amountString} ETH (${weiValue} wei) from ${account} to ${contract._address}`);
            
            // Check if contract exists
            const code = await web3.eth.getCode(contract._address);
            if (code === '0x' || code === '0x0') {
                alert("Critical: No contract found at expected address. Please redeploy.");
                return false;
            }

            // 1. Simulate
            try {
                await contract.methods.deposit().call({ from: account, value: weiValue });
            } catch (simError) {
                console.error("Simulation failed:", simError);
                // Extract internal reason if possible
                const internal = simError.data ? (simError.data.message || simError.data) : simError.message;
                throw new Error(`Simulation failed: ${internal}`);
            }

            // 2. Send
            await contract.methods.deposit().send({
                from: account,
                value: weiValue,
                gas: 300000 // Safer gas limit
            });
            return true;
        } catch (error) {
            console.error("Deposit failed detailed:", error);
            
            // Try to extract internal JSON RPC error if present
            let detailedMsg = error.message;
            if (error.data && error.data.message) {
                 detailedMsg += " | " + error.data.message;
            }
            if (error.reason) {
                 detailedMsg += " | Reason: " + error.reason;
            }

            alert("Deposit Failed: " + detailedMsg);
            return false;
        }
    }, [contract, account]);

    const getCredits = useCallback(async () => {
        if (!contract || !account) return 0;
        try {
             const value = await contract.methods.credits(account).call();
             return Web3.utils.fromWei(value, "ether");
        } catch (error) {
            console.error("Get credits failed", error);
            return 0;
        }
    }, [contract, account]);

    const viewPrivateScore = useCallback(async (targetAddress) => {
         if (!contract || !account) return null;
         try {
             // accessScore is a payable/state-changing function
             const receipt = await contract.methods.accessScore(targetAddress).send({ from: account });
             const event = receipt.events.ScoreRevealed;
             if (event) {
                 return event.returnValues.score;
             }
             return null;
         } catch (error) {
             console.error("View score failed", error);
             throw error;
         }
    }, [contract, account]);

    const getEthBalance = useCallback(async () => {
        if (!web3 || !account) return "0";
        try {
            const balanceWei = await web3.eth.getBalance(account);
            return Web3.utils.fromWei(balanceWei, "ether");
        } catch (error) {
            console.error("Failed to fetch ETH balance", error);
            return "0";
        }
    }, [web3, account]);

    const connectWallet = useCallback(async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setAccount(accounts[0]);
                window.location.reload();
            } catch (error) {
                console.error("User rejected connection", error);
            }
        } else {
            alert("Please install MetaMask!");
        }
    }, []);

    const submitRangeProof = useCallback(async (pA, pB, pC, threshold) => {
        if (!contract || !account) return;
        try {
            console.log("Submitting ZK Proof to contract...", { pA, pB, pC, threshold });
            // Gas estimation might fail if proof invalid, so we set high limit
            await contract.methods.submitRangeProof(pA, pB, pC, threshold)
                .send({ from: account, gas: 500000 });
            return true;
        } catch (error) {
            console.error("Failed to submit range proof:", error);
            throw error;
        }
    }, [contract, account]);

    return { web3, contract, account, isReady, depositCredits, getCredits, getEthBalance, viewPrivateScore, connectWallet, chainId, submitRangeProof };
}
