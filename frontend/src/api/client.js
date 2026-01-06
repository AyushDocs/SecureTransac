import Web3 from "web3";
import { logger } from "../utils/logger";
import { API_BASE_URL, CONTRACT_ADDRESSES, IDENTITY_VAULT_ABI, TRUST_REGISTRY_ABI } from "./config";

let web3;
let contract;
let vaultContract;

if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  contract = new web3.eth.Contract(TRUST_REGISTRY_ABI, CONTRACT_ADDRESSES.TrustRegistry);
  vaultContract = new web3.eth.Contract(IDENTITY_VAULT_ABI, CONTRACT_ADDRESSES.IdentityVault);
  logger.info("Web3 initialized with window.ethereum");
} else {
  logger.warn("No Web3 provider detected. On-chain features will be disabled.");
}

const scoreCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export async function fetchTrustScore(address) {
  const now = Date.now();
  const cached = scoreCache.get(address.toLowerCase());
  
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    logger.info(`Returning cached score for: ${address}`);
    return cached.data;
  }

  logger.info(`Fetching trust score for: ${address}`);
  if (!contract) {
    logger.warn("Contract not initialized, returning mock score");
    return { address, score: 0.5, riskLevel: "medium" };
  }

  try {
    const rawScore = await contract.methods.getScore(address).call();
    const score = Number(rawScore) / 1000;
    const riskLevel = score >= 0.8 ? "low" : score >= 0.4 ? "medium" : "high";
    logger.info(`Score fetched: ${score} (${riskLevel})`);
    const result = { address, score, riskLevel, source: "chain" };
    scoreCache.set(address.toLowerCase(), { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    logger.error("Error fetching trust score from contract:", error);
    const result = { address, score: 0.5, riskLevel: "medium", source: "error" };
    // Don't cache errors for as long
    scoreCache.set(address.toLowerCase(), { timestamp: Date.now() - 25000, data: result });
    return result;
  }
}

export async function fetchDashboardMetrics() {
  logger.info("Fetching dashboard metrics from server");
  try {
    const response = await fetch(`${API_BASE_URL}/analytics`);
    if (!response.ok) throw new Error("Failed to fetch analytics");
    const data = await response.json();
    logger.info("Dashboard metrics fetched successfully", data);
    return data;
  } catch (error) {
    logger.error("Error fetching dashboard metrics:", error);
    throw error;
  }
}

export async function searchAddress(address) {
  logger.info(`Searching for address: ${address}`);
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}`);
    if (!response.ok) throw new Error("User not found");
    const data = await response.json();
    logger.info("Address search result:", data);
    return data;
  } catch (error) {
    logger.error(`Error searching address ${address}:`, error);
    throw error;
  }
}

export async function processReport(reporter, target, text) {
  logger.info(`Submitting report: ${reporter} -> ${target}`);
  try {
    const response = await fetch(`${API_BASE_URL}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporter, target, text }),
    });
    if (!response.ok) throw new Error("Failed to submit report");
    const data = await response.json();
    logger.info("Report submitted successfully", data);
    return data;
  } catch (error) {
    logger.error("Error submitting report:", error);
    throw error;
  }
}

export async function submitManualOverride(address, action, reason) {
  logger.info(`Submitting manual override: ${action} for ${address}`);
  try {
    const response = await fetch(`${API_BASE_URL}/manual-override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, action, reason }),
    });
    if (!response.ok) throw new Error("Failed to submit manual override");
    const data = await response.json();
    logger.info("Manual override submitted successfully", data);
    return data;
  } catch (error) {
    logger.error("Error submitting manual override:", error);
    throw error;
  }
}

export async function setAuthorityStatus(authorityAddress, status) {
  logger.info(`Setting authority status: ${authorityAddress} -> ${status}`);
  if (!vaultContract) {
    logger.error("IdentityVault contract not initialized");
    throw new Error("IdentityVault contract not initialized");
  }

  try {
    const accounts = await web3.eth.getAccounts();
    const result = await vaultContract.methods.setAuthorityStatus(authorityAddress, status).send({
      from: accounts[0],
    });
    logger.info("Authority status updated successfully", result);
    return result;
  } catch (error) {
    logger.error("Error setting authority status:", error);
    throw error;
  }
}

export async function fetchAuthorities() {
  logger.info("Fetching authorities from server");
  try {
    const response = await fetch(`${API_BASE_URL}/authorities`);
    if (!response.ok) throw new Error("Failed to fetch authorities");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching authorities:", error);
    throw error;
  }
}

export async function saveAuthorityMetadata(address, name, email) {
  logger.info(`Saving authority metadata for: ${address}`);
  try {
    const response = await fetch(`${API_BASE_URL}/authorities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, name, email, level: "security" }),
    });
    if (!response.ok) throw new Error("Failed to save authority metadata");
    return await response.json();
  } catch (error) {
    logger.error("Error saving authority metadata:", error);
    throw error;
  }
}

export async function deleteAuthorityMetadata(address) {
  logger.info(`Deleting authority metadata for: ${address}`);
  try {
    const response = await fetch(`${API_BASE_URL}/authorities/${address}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete authority metadata");
    return await response.json();
  } catch (error) {
    logger.error("Error deleting authority metadata:", error);
    throw error;
  }
}

export async function fetchACL() {
  logger.info("Fetching ACL entries from server");
  try {
    const response = await fetch(`${API_BASE_URL}/acl`);
    if (!response.ok) throw new Error("Failed to fetch ACL");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching ACL:", error);
    throw error;
  }
}

export async function fetchScoreUpdates() {
  logger.info("Fetching recent score updates from server");
  try {
    const response = await fetch(`${API_BASE_URL}/score-updates`);
    if (!response.ok) throw new Error("Failed to fetch score updates");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching score updates:", error);
    throw error;
  }
}
