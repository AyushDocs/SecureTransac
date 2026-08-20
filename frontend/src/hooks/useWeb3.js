import { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import RegistryArtifact from "../contracts/TrustRegistry.json";
import TokenArtifact from "../contracts/AVToken.json";
import { useWeb3 as useWeb3Context } from "../context/Web3Context";

/**
 * Legacy Web3 hook for contract interactions.
 * Uses Web3Context for wallet state (address, isConnected, openWalletModal).
 * Initializes raw Web3 + TrustRegistry + AVToken ($AV) contracts for on-chain calls.
 */
export function useWeb3() {
  const { address, isConnected, openWalletModal } = useWeb3Context();
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize Web3 and contract when wallet connects
  useEffect(() => {
    const init = async () => {
      if (!isConnected || !address) {
        setWeb3(null);
        setContract(null);
        setTokenContract(null);
        setIsReady(false);
        return;
      }

      if (!window.ethereum) return;

      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      try {
        const networkId = await web3Instance.eth.net.getId();
        const netId = typeof networkId === 'bigint' ? Number(networkId) : networkId;

        let deployedNetwork = RegistryArtifact.networks[netId];
        if (!deployedNetwork && netId === 1337) {
          deployedNetwork = RegistryArtifact.networks[5777];
        }

        if (deployedNetwork && deployedNetwork.address) {
          const code = await web3Instance.eth.getCode(deployedNetwork.address);
          if (code !== '0x' && code !== '0x0') {
            const instance = new web3Instance.eth.Contract(
              RegistryArtifact.abi,
              deployedNetwork.address,
            );
            setContract(instance);
            setIsReady(true);
            console.log(`[useWeb3] Contract loaded at ${deployedNetwork.address}`);
          } else {
            console.error(`[useWeb3] No bytecode at ${deployedNetwork.address}`);
          }
        } else {
          console.warn("[useWeb3] Contract not deployed to detected network.");
        }

        let tokenNetwork = TokenArtifact.networks[netId];
        if (!tokenNetwork && netId === 1337) {
          tokenNetwork = TokenArtifact.networks[5777];
        }
        if (tokenNetwork && tokenNetwork.address) {
          const tokenCode = await web3Instance.eth.getCode(tokenNetwork.address);
          if (tokenCode !== '0x' && tokenCode !== '0x0') {
            setTokenContract(new web3Instance.eth.Contract(TokenArtifact.abi, tokenNetwork.address));
          }
        }
      } catch (error) {
        console.error("[useWeb3] Failed to initialize:", error);
      }
    };

    init();
  }, [isConnected, address]);

  const account = address;

  const depositCredits = useCallback(async (amountAV) => {
    if (!contract || !tokenContract || !account) return;
    try {
      const amountString = typeof amountAV === 'number' ? amountAV.toString() : amountAV;
      const weiValue = Web3.utils.toWei(amountString, "ether");

      const code = await web3.eth.getCode(contract._address);
      if (code === '0x' || code === '0x0') {
        alert("Critical: No contract found at expected address. Please redeploy.");
        return false;
      }

      const allowance = await tokenContract.methods.allowance(account, contract._address).call();
      if (BigInt(allowance) < BigInt(weiValue)) {
        await tokenContract.methods.approve(contract._address, weiValue).send({ from: account, gas: 100000 });
      }

      await contract.methods.deposit(weiValue).send({ from: account, gas: 300000 });
      return true;
    } catch (error) {
      console.error("Deposit failed:", error);
      let detailedMsg = error.message;
      if (error.data?.message) detailedMsg += " | " + error.data.message;
      if (error.reason) detailedMsg += " | Reason: " + error.reason;
      alert("Deposit Failed: " + detailedMsg);
      return false;
    }
  }, [contract, tokenContract, account, web3]);

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

  const getAVBalance = useCallback(async () => {
    if (!tokenContract || !account) return "0";
    try {
      const value = await tokenContract.methods.balanceOf(account).call();
      return Web3.utils.fromWei(value, "ether");
    } catch (error) {
      console.error("Get AV balance failed", error);
      return "0";
    }
  }, [tokenContract, account]);

  const viewPrivateScore = useCallback(async (targetAddress) => {
    if (!contract || !account) return null;
    try {
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

  const connectWallet = useCallback(() => {
    openWalletModal();
  }, [openWalletModal]);

  const submitRangeProof = useCallback(async (pA, pB, pC, threshold) => {
    if (!contract || !account) return;
    try {
      await contract.methods.submitRangeProof(pA, pB, pC, threshold)
        .send({ from: account, gas: 500000 });
      return true;
    } catch (error) {
      console.error("Failed to submit range proof:", error);
      throw error;
    }
  }, [contract, account]);

  return {
    web3, contract, account, isReady,
    depositCredits, getCredits, getEthBalance, getAVBalance,
    viewPrivateScore, connectWallet, submitRangeProof,
    chainId: null, // chainId available from Web3Context if needed
  };
}
