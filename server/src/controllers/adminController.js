const aiService = require('../services/aiService');
const persistence = require('../services/persistenceService');

exports.getAnalytics = (req, res) => {
    console.log('[SecureTransac] Fetching global analytics');
    res.json(persistence.getAnalytics());
};

exports.evaluateAddress = async (req, res) => {
    const { address } = req.body;
    console.log(`[SecureTransac] Evaluating address: ${address}`);
    if (!address) return res.status(400).json({ error: 'Address required' });
    
    const result = await aiService.processEvaluation(address);
    res.json(result);
};

exports.getUserDetails = (req, res) => {
    const { address } = req.params;
    console.log(`[SecureTransac] Fetching user details for: ${address}`);
    const data = persistence.getUser(address);
    res.json({ address, ...data });
};

exports.processTransaction = async (req, res) => {
    const { from, to, amount } = req.body;
    console.log(`[SecureTransac] Processing transaction: ${from} -> ${to} (${amount})`);
    if (!from || !to || amount === undefined) return res.status(400).json({ error: 'Missing from, to, or amount' });

    await aiService.processTransaction(from, to, parseFloat(amount));
    res.json({ message: 'Transaction processed and scores updated' });
};

exports.processReport = async (req, res) => {
    const { reporter, target, text } = req.body;
    console.log(`[SecureTransac] Processing report: ${reporter} reports ${target}`);
    if (!reporter || !target || !text) return res.status(400).json({ error: 'Missing reporter, target, or text' });

    await aiService.processReport(reporter, target, text);
    res.json({ message: 'Report analyzed and target score adjusted' });
};

exports.addEvent = (req, res) => {
    const { address, type, details } = req.body;
    console.log(`[SecureTransac] Recording event: ${type} for ${address}`);
    if (!address || !type) return res.status(400).json({ error: 'Missing fields' });

    const user = persistence.getUser(address);
    if (type === 'TRANSACTION') user.transactions.push(details);
    if (type === 'COMPLAINT') user.complaints.push(details);

    persistence.updateUser(address, user);
    res.json({ message: 'Event recorded', address });
};

exports.manualOverride = async (req, res) => {
    const { address, action, reason } = req.body;
    console.log(`[SecureTransac] Manual Override requested for ${address}: ${action}`);
    if (!address || !action || !reason) return res.status(400).json({ error: 'Missing address, action, or reason' });

    try {
        const result = await aiService.manualOverride(address, action, reason);
        res.json(result);
    } catch (error) {
        console.error('[SecureTransac] Manual override failed:', error);
        res.status(500).json({ error: 'Manual override failed', message: error.message });
    }
};

exports.getAuditLogs = (req, res) => {
    console.log('[SecureTransac] Fetching audit logs');
    // For now, return a mock set of logs or aggregate from persistence
    const logs = [
        { id: '1', action: 'System Initialization', user: 'system', target: 'global', type: 'configuration', timestamp: new Date().toISOString() },
        { id: '2', action: 'API Online', user: 'system', target: 'health', type: 'configuration', timestamp: new Date().toISOString() }
    ];
    // In a real app, this would query a logs table/file
    res.json(logs);
};

// Authority Metadata Handlers
exports.getAuthorities = (req, res) => {
    console.log('[SecureTransac] Fetching authorities');
    res.json(persistence.getAuthorities());
};

exports.saveAuthority = (req, res) => {
    const { address, name, email, level } = req.body;
    console.log(`[SecureTransac] Saving authority metadata for ${address}`);
    if (!address || !name || !email) return res.status(400).json({ error: 'Missing address, name, or email' });
    
    persistence.saveAuthority(address, { name, email, level: level || 'security' });
    res.json({ message: 'Authority metadata saved', address });
};

exports.removeAuthority = (req, res) => {
    const { address } = req.params;
    console.log(`[SecureTransac] Removing authority metadata for ${address}`);
    if (!address) return res.status(400).json({ error: 'Address required' });

    persistence.removeAuthority(address);
    res.json({ message: 'Authority metadata removed', address });
};

exports.updateRiskHeatmap = (req, res) => {
    const { data } = req.body;
    console.log('[SecureTransac] Updating Risk Heatmap data');
    if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'Heatmap data required' });
    
    persistence.updateRiskHeatmap(data);
    res.json({ message: 'Risk Heatmap updated' });
};

exports.updateEvaluationVelocity = (req, res) => {
    const { data } = req.body;
    console.log('[SecureTransac] Updating Evaluation Velocity data');
    if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'Velocity data required' });
    
    persistence.updateEvaluationVelocity(data);
    res.json({ message: 'Evaluation Velocity updated' });
};

exports.getACL = (req, res) => {
    console.log('[SecureTransac] Fetching ACL entries');
    res.json(persistence.getACLEntries());
};

exports.getScoreUpdates = (req, res) => {
    console.log('[SecureTransac] Fetching recent score updates');
    res.json(persistence.getRecentScoreUpdates());
};
