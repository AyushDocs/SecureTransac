import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import http from 'http';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Import CommonJS modules
import swaggerConfig from './src/config/swagger.js';
import rateLimiter from './src/middleware/rateLimiter.js';
import adminRoutes from './src/routes/adminRoutes.js';
import ipfsRoutes from './src/routes/ipfsRoutes.js';
import partnerRoutes from './src/routes/partnerRoutes.js';
import socketService from './src/services/socketService.js';
import web3Service from './src/services/web3Service.js';

const { specs, swaggerUi } = swaggerConfig;
const { apiLimiter } = rateLimiter;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files (for PWA icons if needed)
app.use(express.static('public'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/partner', partnerRoutes);

// General
app.get('/health', (req, res) => res.send('SecureTransac API logic: Online'));

// 404 Handler
app.use((req, res, next) => {
    console.warn(`[SecureTransac] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[SecureTransac] Error processing ${req.method} ${req.url}:`, err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const server = http.createServer(app);
socketService.init(server);
web3Service.startEventListeners();

// Check if running directly (ESM equivalent of require.main === module)
// In ESM, the file is always the module. We check if it was the entry point.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    server.listen(PORT, () => {
        console.log(`\x1b[32m[SecureTransac]\x1b[0m Server running on port ${PORT} (ESM)`);
    });
}

export { app, server };

