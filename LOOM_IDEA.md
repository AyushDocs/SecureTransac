# 🎥 Loom Video Demo Strategy

**Goal:** Showcase the features of SecureTransac within 3-5 minutes.

---

## 🎬 Section 1: Setup & Context (30s)
*   **Visual:** Start on the "Landing Page" or "Login Screen".
*   **Action:** Click "Connect Wallet".
*   **Voiceover:** "Welcome to SecureTransac. Today I'm going to show you how we're making Web3 safer using On-Chain AI. I'm logging in with my MetaMask locally."

## 🎬 Section 2: The Dashboard & Real-Time Data (1m)
*   **Visual:** Admin Dashboard.
*   **Action:** Point out the **Live Activity Feed** and the **Risk Heatmap**.
*   **Highlight:** "This isn't a static database. Everything you see here—transactions, verification requests—is pulled directly from the blockchain."
*   **Demo Trigger:** In a separate terminal window (hidden or shown), run `npm run seed` to trigger new transactions.
*   **Result:** "Watch the feed update instantly via WebSockets... there! We just caught a suspicious transaction."

## 🎬 Section 3: Identity & ZK Verification (1m 30s)
*   **Visual:** Verification Page.
*   **Action:** 
    1.  Switch to "Company View".
    2.  Approve a pending verification request.
    3.  Switch to "User View".
    4.  Show the "Verified" badge.
*   **Voiceover:** "Identity is tricky. We use IPFS to store encrypted data, but more importantly, we deployed **Zero-Knowledge Verifiers**. This allows this user to prove they are verified to a third party without revealing their actual ID card."

## 🎬 Section 4: AI & Social Graph (1m)
*   **Visual:** "Address Profile" page (search for a user).
*   **Action:** Find a user with a low score. Hover over the score breakdown.
*   **Voiceover:** "Why is this user red? Our AI analyzed their **Social Graph**. They interacted with a known scammer wallet 10 minutes ago. The system applied a 'Guilt by Association' penalty automatically."

## 🎬 Section 5: Technical Flex & Closing (30s)
*   **Visual:** Code Editor (VS Code) flashing `Identity.circom` or `TrustRegistry.sol`.
*   **Action:** Scroll through the Gas Optimization or Caching logic.
*   **Voiceover:** "We optimized gas costs by 40% using struct packing and added a Redis caching layer for speed. This is production-ready architecture. Thanks for watching."

---

## 🛠️ Preparation Checklist
1.  **Clean State:** Reset the blockchain (`truffle migrate --reset`).
2.  **Seed Data:** Run the initial seed so graphs aren't empty.
3.  **Terminal Ready:** Have the seed script command typed and ready to hit "Enter".
4.  **Zoom Level:** Ensure browser zoom is at 110% for clarity.

