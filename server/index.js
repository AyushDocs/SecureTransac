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

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\x1b[32m[SecureTransac]\x1b[0m Server running on port ${PORT}`);
    });
}

module.exports = app;
