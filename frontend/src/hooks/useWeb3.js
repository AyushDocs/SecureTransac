
import { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import RegistryArtifact from "../contracts/TrustRegistry.json";

// Should match deployed network
const NETWORK_ID = "5777"; // Ganache default or configured

export function useWeb3() {
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);
                
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    setAccount(accounts[0]);

                    const networkId = await web3Instance.eth.net.getId();
                    const deployedNetwork = RegistryArtifact.networks[networkId];
                    
                    if (deployedNetwork && deployedNetwork.address) {
                        const instance = new web3Instance.eth.Contract(
                            RegistryArtifact.abi,
                            deployedNetwork.address,
                        );
                        setContract(instance);
                        setIsReady(true);
                    } else {
                        console.warn("Contract not deployed to detected network.");
                    }

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
            await contract.methods.deposit().send({
                from: account,
                value: Web3.utils.toWei(amountEth.toString(), "ether")
            });
            alert("Deposit Successful!");
            return true;
        } catch (error) {
            console.error("Deposit failed", error);
            alert("Deposit Failed: " + error.message);
            return false;
        }
    }, [contract, account]);

    const getCredits = useCallback(async () => {
        if (!contract || !account) return 0;
        try {
             // 'credits' is public mapping in inherited contract
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
             // accessScore is a payable/state-changing function that deducts credits
             // It returns the score in the event/transaction receipt, but not directly to caller if it's a write tx.
             // Wait, accessScore is 'public returns (uint256)'. If called via transaction, we need to inspect logs.
             
             const receipt = await contract.methods.accessScore(targetAddress).send({ from: account });
             
             // Parse 'ScoreRevealed' event
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

    return { web3, contract, account, isReady, depositCredits, getCredits, viewPrivateScore };
}
