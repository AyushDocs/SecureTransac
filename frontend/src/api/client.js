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
const getAuthHeaders = () => {
  const token = localStorage.getItem("userToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

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
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      headers: getAuthHeaders()
    });
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

export async function registerUser(address, role, metadata = {}) {
  logger.info(`Registering user ${address} as ${role}`);
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ address, role, metadata }),
    });
    if (!response.ok) throw new Error("Failed to register user");
    return await response.json();
  } catch (error) {
    logger.error("Error registering user:", error);
    throw error;
  }
}

export async function submitComment(from, target, txId, text, rating) {
  logger.info(`Submitting comment: ${from} on ${target} for ${txId}`);
  try {
    const response = await fetch(`${API_BASE_URL}/comment`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ from, target, txId, text, rating }),
    });
    if (!response.ok) throw new Error("Failed to submit comment");
    const data = await response.json();
    logger.info("Comment submitted successfully", data);
    return data;
  } catch (error) {
    logger.error("Error submitting comment:", error);
    throw error;
  }
}

export async function processReport(reporter, target, text) {
  logger.info(`Submitting report: ${reporter} -> ${target}`);
  try {
    const response = await fetch(`${API_BASE_URL}/report`, {
      method: "POST",
      headers: getAuthHeaders(),
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

export async function submitManualOverride(address, action, reason, targetScore = null) {
  logger.info(`Submitting manual override: ${action} for ${address} (Target: ${targetScore})`);
  try {
    const response = await fetch(`${API_BASE_URL}/manual-override`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ address, action, reason, targetScore }),
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
    const response = await fetch(`${API_BASE_URL}/authorities`, {
      headers: getAuthHeaders()
    });
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
      headers: getAuthHeaders(),
      body: JSON.stringify({ address, name, email, level: "security" }),
    });
    if (!response.ok) throw new Error("Failed to save authority metadata");
    return await response.json();
  } catch (error) {
    logger.error("Error saving authority metadata:", error);
    throw error;
  }
}

export async function updateAuthorityMetadata(address, metadata) {
  logger.info(`Updating authority metadata for: ${address}`);
  try {
    const response = await fetch(`${API_BASE_URL}/authorities/${address}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ metadata }),
    });
    if (!response.ok) throw new Error("Failed to update authority metadata");
    return await response.json();
  } catch (error) {
    logger.error("Error updating authority metadata:", error);
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
    const response = await fetch(`${API_BASE_URL}/acl`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch ACL");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching ACL:", error);
    throw error;
  }
}

export async function setReporterStatus(reporterAddress, status) {
  logger.info(`Setting reporter status: ${reporterAddress} -> ${status}`);
  if (!contract) {
    logger.error("TrustRegistry contract not initialized");
    throw new Error("TrustRegistry contract not initialized");
  }

  try {
    const accounts = await web3.eth.getAccounts();
    const result = await contract.methods.setReporterStatus(reporterAddress, status).send({
      from: accounts[0],
    });
    logger.info("Reporter status updated successfully", result);
    return result;
  } catch (error) {
    logger.error("Error setting reporter status:", error);
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

export async function fetchVerifications(params = {}) {
  const query = new URLSearchParams(params).toString();
  logger.info(`Fetching verifications with query: ${query}`);
  try {
    const response = await fetch(`${API_BASE_URL}/verifications?${query}`);
    if (!response.ok) throw new Error("Failed to fetch verifications");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching verifications:", error);
    throw error;
  }
}

export async function requestVerification(userAddress, companyAddress, metadata = {}) {
  logger.info(`Requesting verification: ${userAddress} -> ${companyAddress}`);
  try {
    const response = await fetch(`${API_BASE_URL}/request-verification`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userAddress, companyAddress, metadata }),
    });
    if (!response.ok) throw new Error("Failed to request verification");
    return await response.json();
  } catch (error) {
    logger.error("Error requesting verification:", error);
    throw error;
  }
}

export async function verifyUser(requestId, reviewerAddress, status, targetScore = 900) {
  logger.info(`Processing verification: ${requestId} (${status})`);
  try {
    const response = await fetch(`${API_BASE_URL}/verify-user`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ requestId, reviewerAddress, status, targetScore }),
    });
    if (!response.ok) throw new Error("Failed to verify user");
    return await response.json();
  } catch (error) {
    logger.error("Error verifying user:", error);
    throw error;
  }
}

export async function getNonce(address) {
  logger.info(`Fetching nonce for: ${address}`);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/nonce/${address}`);
    if (!response.ok) throw new Error("Failed to fetch nonce");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching nonce:", error);
    throw error;
  }
}

export async function verifySignature(address, signature) {
  logger.info(`Verifying signature for: ${address}`);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signature }),
    });
    if (!response.ok) throw new Error("Authentication failed");
    return await response.json();
  } catch (error) {
    logger.error("Error verifying signature:", error);
    throw error;
  }
}

export async function pinMetadata(metadata) {
  logger.info("Pinning metadata to IPFS...");
  try {
    const response = await fetch(`${API_BASE_URL}/ipfs/pin`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ metadata }),
    });
    if (!response.ok) throw new Error("Failed to pin metadata");
    return await response.json();
  } catch (error) {
    logger.error("Error pinning metadata:", error);
    throw error;
  }
}

export async function storeIdentityData(cid) {
  logger.info(`Storing Identity CID on-chain: ${cid}`);
  if (!vaultContract) throw new Error("IdentityVault contract not initialized");

  try {
    const accounts = await web3.eth.getAccounts();
    const result = await vaultContract.methods.storeData(cid).send({
      from: accounts[0],
    });
    logger.info("Identity CID stored successfully", result);
    return result;
  } catch (error) {
    logger.error("Error storing identity data:", error);
    throw error;
  }
}

export async function getIdentityData(userAddress) {
  logger.info(`Fetching Identity CID for: ${userAddress}`);
  if (!vaultContract) throw new Error("IdentityVault contract not initialized");

  try {
    const cid = await vaultContract.methods.requestData(userAddress).call();
    logger.info(`Fetched CID: ${cid}`);
    return cid;
  } catch (error) {
    logger.error("Error fetching identity data:", error);
    throw error;
  }
}
