require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/admin', adminRoutes);

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

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\x1b[32m[SecureTransac]\x1b[0m Server running on port ${PORT}`);
    });
}

module.exports = app;
