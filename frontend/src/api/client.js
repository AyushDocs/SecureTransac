import Web3 from "web3";
import { logger } from "../utils/logger";
import { API_BASE_URL, CONTRACT_ADDRESSES, ERC721S_ABI, IDENTITY_VAULT_ABI, TRUST_REGISTRY_ABI } from "./config";

let web3;
let contract;
let vaultContract;
let sbtContract;

if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  contract = new web3.eth.Contract(TRUST_REGISTRY_ABI, CONTRACT_ADDRESSES.TrustRegistry);
  vaultContract = new web3.eth.Contract(IDENTITY_VAULT_ABI, CONTRACT_ADDRESSES.IdentityVault);
  sbtContract = new web3.eth.Contract(ERC721S_ABI, CONTRACT_ADDRESSES.SecureTransacSBT);
  logger.info("Web3 initialized with window.ethereum");
} else {
  logger.warn("No Web3 provider detected. On-chain features will be disabled.");
}

export async function checkSBTMinted(address) {
  if (!sbtContract) return false;
  try {
    const balance = await sbtContract.methods.balanceOf(address).call();
    return Number(balance) > 0;
  } catch (error) {
    logger.error("Error checking SBT status (Contract might not be deployed):", error);
    // Return null instead of false if it's a connection/contract error
    // This prevents the UI from resetting 'minted' to false if it was already true
    return null;
  }
}

export async function mintSBT() {
  if (!sbtContract) throw new Error("SBT Contract not connected");
  const accounts = await web3.eth.getAccounts();
  return await sbtContract.methods.mint().send({ from: accounts[0] });
}
export const getAuthHeaders = () => {
  const token = localStorage.getItem("userToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export async function updateTrustScore(targetAddress, score) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/manual-override`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ targetAddress, score })
        });
        if (!response.ok) throw new Error("Failed to update score");
        return await response.json();
    } catch (error) {
        console.error("Score update error:", error);
        throw error;
    }
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

  logger.info(`Fetching decrypted trust score for: ${address}`);
  
  try {
    // Fetch decrypted score from backend (returns 0-1000 scale)
    const response = await fetch(`${API_BASE_URL}/admin/score/${address}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
       // If backend fails (e.g. 404), return default
       logger.warn(`Failed to fetch score from backend: ${response.status}`);
       return { address, score: 0.5, riskLevel: "medium", source: "default" };
    }

    const data = await response.json();
    // Normalize 0-1000 to 0-1 for frontend components
    const score = (data.score !== undefined) ? (data.score / 1000) : 0.5;
    const riskLevel = score >= 0.8 ? "low" : score >= 0.4 ? "medium" : "high";
    
    logger.info(`Score fetched from API: ${score} (${riskLevel})`);
    
    const result = { address, score, riskLevel, source: "api" };
    scoreCache.set(address.toLowerCase(), { timestamp: Date.now(), data: result });
    return result;

  } catch (error) {
    logger.error("Error fetching trust score from API:", error);
    const result = { address, score: 0.5, riskLevel: "medium", source: "error" };
    scoreCache.set(address.toLowerCase(), { timestamp: Date.now() - 25000, data: result });
    return result;
  }
}

export async function fetchDashboardMetrics() {
  logger.info("Fetching dashboard metrics from server");
  try {
    const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
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
    // Note: Assuming searchAddress endpoint is under admin for now based on previous config
    const response = await fetch(`${API_BASE_URL}/admin/users/${address}`);
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
    const response = await fetch(`${API_BASE_URL}/admin/register`, {
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
    const response = await fetch(`${API_BASE_URL}/admin/comment`, {
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
    const response = await fetch(`${API_BASE_URL}/admin/report`, {
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
    const response = await fetch(`${API_BASE_URL}/admin/authorities`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch authorities");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching authorities:", error);
    throw error;
  }
}

export async function fetchSystemContracts() {
  logger.info("Fetching system contract addresses from server");
  try {
    const response = await fetch(`${API_BASE_URL}/admin/contracts`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch contracts");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching system contracts:", error);
    throw error;
  }
}

export async function fetchNetworkStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/network-stats`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch network stats:", error);
    return null;
  }
}

export async function fetchSystemStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/system/status`, { headers: getAuthHeaders() });
        return response.ok ? await response.json() : null;
    } catch { return null; }
}

export async function toggleSystemPause(paused) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/system/pause`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ paused })
        });
        return await response.json();
    } catch { return null; }
}

export async function updateGasConfig(multiplier, limit) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/system/gas`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ multiplier, limit })
        });
        return await response.json();
    } catch { return null; }
}

export async function upgradeSystem() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/system/upgrade`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch { return null; }
}

export async function saveAuthorityMetadata(address, name, email, tier = 1) {
  logger.info(`Saving authority metadata for: ${address} (Tier: ${tier})`);
  try {
    const response = await fetch(`${API_BASE_URL}/admin/authorities`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ address, name, email, level: tier === 3 ? "diamond" : tier === 2 ? "institutional" : "security" }),
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
    const response = await fetch(`${API_BASE_URL}/admin/authorities/${address}`, {
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
    const response = await fetch(`${API_BASE_URL}/admin/authorities/${address}`, {
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
    const response = await fetch(`${API_BASE_URL}/admin/acl`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch ACL");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching ACL:", error);
    throw error;
  }
}

export async function setReporterStatus(reporterAddress, status, tier = 1) {
  logger.info(`Setting reporter status: ${reporterAddress} -> ${status} (Tier: ${tier})`);
  
  if (!contract) {
    logger.error("TrustRegistry contract not initialized");
    throw new Error("TrustRegistry contract not initialized");
  }

  if (!reporterAddress) {
      throw new Error("setReporterStatus: reporterAddress is missing/null");
  }

  try {
    const accounts = await web3.eth.getAccounts();
    logger.info(`Sending transaction from ${accounts[0]} to set status for ${reporterAddress}`);
    
    // ABI only has 2 arguments: reporter (address), status (bool)
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
    const response = await fetch(`${API_BASE_URL}/admin/score-updates`);
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
    const response = await fetch(`${API_BASE_URL}/admin/verifications?${query}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch verifications");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching verifications:", error);
    // Graceful fallback to prevent UI crash
    return [];
  }
}

export async function requestVerification(userAddress, companyAddress, metadata = {}) {
  logger.info(`Requesting verification: ${userAddress} -> ${companyAddress}`);
  try {
    const response = await fetch(`${API_BASE_URL}/admin/request-verification`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userAddress, companyAddress, metadata }),
    });
    if (!response.ok) {
        let errorMessage = "Failed to request verification";
        try {
            const errorData = await response.json();
            if (errorData.error) errorMessage = errorData.error;
        } catch (e) {
            // Use status text if JSON parsing fails
            errorMessage = `Request failed: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    logger.error("Error requesting verification:", error);
    throw error;
  }
}

export async function verifyUser(requestId, reviewerAddress, status, targetScore = 900) {
  logger.info(`Processing verification: ${requestId} (${status})`);
  try {
    const response = await fetch(`${API_BASE_URL}/admin/verify-user`, {
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
    const response = await fetch(`${API_BASE_URL}/admin/auth/nonce/${address}`);
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
    const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
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
    const response = await fetch(`${API_BASE_URL}/admin/ipfs/pin`, {
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
      gas: 500000 // Force gas limit to prevent estimation errors
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

// ============================================
// RBAC API Functions
// ============================================

/**
 * Fetch current user info with all assigned roles
 * @returns {Promise<{walletAddress: string, roles: string[], activeRole: string}>}
 */
export async function fetchCurrentUser() {
  logger.info("Fetching current user info from /me");
  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch user info");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching current user:", error);
    throw error;
  }
}

export async function generateZKProof(address, threshold, secret) {
  logger.info("Requesting server-side ZK Proof...");
  try {
    const response = await fetch(`${API_BASE_URL}/admin/proof`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ address, threshold, secret }),
    });
    if (!response.ok) {
       const err = await response.json();
       throw new Error(err.error || "Proof generation failed");
    }
    return await response.json();
  } catch (error) {
    logger.error("Error generating ZK proof:", error);
    throw error;
  }
}

export async function verifyZKProof(proof, publicSignals) {
  logger.info("Requesting ZK Proof Verification...");
  try {
    const response = await fetch(`${API_BASE_URL}/admin/verify-proof`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proof, publicSignals }),
    });
    if (!response.ok) {
       const err = await response.json();
       throw new Error(err.error || "Verification failed");
    }
    return await response.json();
  } catch (error) {
    logger.error("Error verifying ZK proof:", error);
    throw error;
  }
}

export async function generateStealthAddress() {
  logger.info("Requesting Stealth Address...");
  try {
    const response = await fetch(`${API_BASE_URL}/admin/stealth`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    return await response.json();
  } catch (error) {
    logger.error("Error generating stealth address:", error);
    throw error;
  }
}

export async function fetchAuditLogs() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch audit logs");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching audit logs:", error);
    throw error;
  }
}

export async function fetchUserReport(address) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reports/user/${address}`, {
       headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch report");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching user report:", error);
    throw error;
  }
}

/**
 * Switch active role/dashboard context
 * @param {string} role - The role to switch to
 * @returns {Promise<{success: boolean, roles: string[], activeRole: string}>}
 */
export async function switchUserRole(role) {
  logger.info(`Switching to role: ${role}`);
  try {
    const response = await fetch(`${API_BASE_URL}/admin/switch-role`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to switch role");
    }
    return await response.json();
  } catch (error) {
    logger.error("Error switching role:", error);
    throw error;
  }
}

/**
 * Assign roles to a wallet (admin only)
 * @param {string} walletAddress 
 * @param {string[]} roles 
 * @returns {Promise<{success: boolean, roles: string[], activeRole: string}>}
 */
export async function assignUserRoles(walletAddress, roles) {
  logger.info(`Assigning roles to ${walletAddress}:`, roles);
  try {
    const response = await fetch(`${API_BASE_URL}/admin/assign-roles`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ walletAddress, roles }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to assign roles");
    }
    return await response.json();
  } catch (error) {
    logger.error("Error assigning roles:", error);
    throw error;
  }
}

/**
 * Get roles for a specific wallet address
 * @param {string} address 
 * @returns {Promise<{roles: string[], activeRole: string}>}
 */
export async function getUserRoles(address) {
  logger.info(`Fetching roles for: ${address}`);
  try {
    const response = await fetch(`${API_BASE_URL}/admin/user-roles/${address}`);
    if (!response.ok) throw new Error("Failed to fetch user roles");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching user roles:", error);
    throw error;
  }
}

export async function getBlindKeys() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/blind/keys`);
    if (!response.ok) throw new Error("Failed to fetch blind keys");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching blind keys:", error);
    throw error;
  }
}

export async function signBlind(blinded) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/blind/sign`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ blinded }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to sign blinded message");
    }
    return await response.json();
  } catch (error) {
    logger.error("Error signing blinded message:", error);
    throw error;
  }
}

export async function submitAnonymousReport(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/blind/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit anonymous report");
    }
    return await response.json();
  } catch (error) {
    logger.error("Error submitting anonymous report:", error);
    throw error;
  }
}
export async function submitAppeal(reason, currentScore, metadata = {}) {
  logger.info("Submitting trust score appeal...");
  try {
    const response = await fetch(`${API_BASE_URL}/appeals`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, currentScore, metadata }),
    });
    if (!response.ok) throw new Error("Failed to submit appeal");
    return await response.json();
  } catch (error) {
    logger.error("Error submitting appeal:", error);
    throw error;
  }
}

export async function fetchAppeals() {
  logger.info("Fetching appeals...");
  try {
    const response = await fetch(`${API_BASE_URL}/appeals`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch appeals");
    return await response.json();
  } catch (error) {
    logger.error("Error fetching appeals:", error);
    throw error;
  }
}

export async function processAppeal(appealId, status, comment, adjustmentScore) {
  logger.info(`Processing appeal ${appealId} -> ${status}`);
  try {
    const response = await fetch(`${API_BASE_URL}/appeals/process`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ appealId, status, comment, adjustmentScore }),
    });
    if (!response.ok) throw new Error("Failed to process appeal");
    return await response.json();
  } catch (error) {
    logger.error("Error processing appeal:", error);
    throw error;
  }
}

export async function setContractThreshold(contractAddress, minScore) {
  logger.info(`Setting threshold for ${contractAddress} to ${minScore}`);
  if (!contract) throw new Error("TrustRegistry contract not initialized");

  try {
    const accounts = await web3.eth.getAccounts();
    const result = await contract.methods.setContractThreshold(contractAddress, minScore).send({
      from: accounts[0],
    });
    logger.info("Contract threshold updated successfully", result);
    return result;
  } catch (error) {
    logger.error("Error setting contract threshold:", error);
    throw error;
  }
}

export async function getContractMaintainer(contractAddress) {
  if (!contract) return null;
  try {
    return await contract.methods.contractMaintainer(contractAddress).call();
  } catch (error) {
    return null;
  }
}

export async function getContractsByMaintainer(address) {
  if (!contract) return [];
  try {
    return await contract.methods.getContractsByMaintainer(address).call();
  } catch (error) {
    logger.error("Error fetching maintainer contracts:", error);
    return [];
  }
}
export async function applyForLoan(address, file) {
  logger.info(`Applying for loan: ${address}`);
  try {
    const formData = new FormData();
    formData.append("address", address);
    if (file) {
        formData.append("document", file);
    }

    // Since this endpoint uses Multer, we don't set Content-Type JSON
    // fetch will automatically set multipart/form-data with boundary
    const token = localStorage.getItem("userToken");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}/partner/apply-loan`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) throw new Error("Loan application failed");
    const data = await response.json();
    logger.info("Loan application result:", data);
    return data;
  } catch (error) {
    logger.error("Error applying for loan:", error);
    throw error;
  }
}
