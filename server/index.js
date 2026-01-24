require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const adminRoutes = require('./src/routes/adminRoutes');
const ipfsRoutes = require('./src/routes/ipfsRoutes');
const { specs, swaggerUi } = require('./src/config/swagger');
const { apiLimiter } = require('./src/middleware/rateLimiter');

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

const http = require('http');
const socketService = require('./src/services/socketService');
const web3Service = require('./src/services/web3Service');

const server = http.createServer(app);
socketService.init(server);
web3Service.startEventListeners();

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`\x1b[32m[SecureTransac]\x1b[0m Server running on port ${PORT}`);
    });
}

module.exports = { app, server };
