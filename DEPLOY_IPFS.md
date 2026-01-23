# IPFS / Decentralized Deployment Guide

To deploy the **SecureTransac** frontend to a decentralized network like IPFS (via Fleek, Pinata, or a local node), follow these steps:

## Prerequisites

1.  **Node.js** installed.
2.  **IPFS Companion** (optional, for local testing).
3.  An account on [Fleek](https://fleek.co/) (recommended for easy CI/CD) or Pinata.

## Configuration Changes (Already Applied)

The project has been pre-configured for IPFS hosting:
-   **`vite.config.js`**: `base: './'` has been set to ensure relative paths for assets (crucial for IPFS gateways).
-   **`App.jsx`**: Switched from `BrowserRouter` to `HashRouter`. IPFS gateways don't support server-side routing, so hash-based routing (`/#/dashboard`) is required.

## Build for IPFS

Run the following command to generate the static files:

```bash
cd frontend
npm run build
```

This will create a `dist/` directory containing the optimized, static production build.

## Deployment Options

### Option A: Deploy via Fleek (Recommended)

1.  Push your code to GitHub.
2.  Sign up/Login to [Fleek](https://app.fleek.co).
3.  Click **"Add New Site"**.
4.  Connect your GitHub repository.
5.  Fleek will auto-detect Vite. Ensure the settings are:
    *   **Framework**: Vite
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
6.  Click **Deploy**.
7.  Fleek will provide you with an IPFS hash (CID) and a `*.on.fleek.co` domain.

### Option B: Deploy via IPFS CLI / Desktop

1.  Install [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/).
2.  Open IPFS Desktop and go to the **Files** tab.
3.  Click **Import** -> **Folder**.
4.  Select the `frontend/dist` folder you just built.
5.  Once imported, click the **three dots** next to the folder and select **Copy CID**.
6.  Your app is now accessible at `https://ipfs.io/ipfs/<YOUR_CID>/`.

### Option C: Deploy via Pinata

1.  Zip the contents of the `dist` folder.
2.  Go to [Pinata](https://app.pinata.cloud/).
3.  Upload the Zip file or the Folder directly.
4.  Access via the gateway using the returned CID.

## Verification

Once deployed, open the IPFS link. You should see the login screen. Since the backend API and Blockchain RPC are external connections, the static frontend on IPFS will still be able to communicate with them (ensure CORS is configured on your backend if it's not localhost).
