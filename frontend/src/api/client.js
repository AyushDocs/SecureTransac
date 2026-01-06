// API client placeholder - mock data fetching
const API_BASE = "/api";

export async function fetchTrustScore(address) {
  // Mock response
  return {
    address,
    score: Math.random(),
    riskLevel: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
  };
}

export async function fetchDashboardMetrics() {
  return {
    blockedTransactions: 1247,
    totalEvaluations: 89432,
    activeWallets: 12847,
    flaggedAddresses: 342,
  };
}

export async function searchAddress(query) {
  return {
    found: true,
    address: query,
  };
}

export async function fetchACL() {
  return [];
}

export async function updateThreshold(value) {
  return { success: true, threshold: value };
}
