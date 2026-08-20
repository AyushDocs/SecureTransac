import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDashboardMetrics, processReport, searchAddress } from "./client";
import { API_BASE_URL } from "./config";

// Mock global fetch
global.fetch = vi.fn();

describe("Frontend API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDashboardMetrics", () => {
    it("fetches metrics successfully from the server", async () => {
      const mockData = { totalEvaluations: 100, activeWallets: 50 };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchDashboardMetrics();
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/analytics`,
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it("throws an error when the fetch fails", async () => {
      fetch.mockResolvedValueOnce({ ok: false });
      await expect(fetchDashboardMetrics()).rejects.toThrow("Failed to fetch analytics");
    });
  });

  describe("searchAddress", () => {
    it("fetches user details for a given address", async () => {
      const address = "0x123";
      const mockData = { address, trustScore: 0.8 };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await searchAddress(address);
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/users/${address}`);
      expect(result).toEqual(mockData);
    });
  });

  describe("processReport", () => {
    it("submits a report to the server", async () => {
      const report = { reporter: "0x1", target: "0x2", text: "Scam" };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await processReport(report.reporter, report.target, report.text);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/report`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(report),
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
