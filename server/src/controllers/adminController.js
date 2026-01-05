const aiService = require('../services/aiService');
const persistence = require('../services/persistenceService');

exports.getAnalytics = (req, res) => {
    res.json(persistence.getAnalytics());
};

exports.evaluateAddress = async (req, res) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address required' });
    
    const result = await aiService.processEvaluation(address);
    res.json(result);
};

exports.getUserDetails = (req, res) => {
    const { address } = req.params;
    const data = persistence.getUser(address);
    res.json({ address, ...data });
};

exports.processTransaction = async (req, res) => {
    const { from, to, amount } = req.body;
    if (!from || !to || amount === undefined) return res.status(400).json({ error: 'Missing from, to, or amount' });

    await aiService.processTransaction(from, to, parseFloat(amount));
    res.json({ message: 'Transaction processed and scores updated' });
};

exports.processReport = async (req, res) => {
    const { reporter, target, text } = req.body;
    if (!reporter || !target || !text) return res.status(400).json({ error: 'Missing reporter, target, or text' });

    await aiService.processReport(reporter, target, text);
    res.json({ message: 'Report analyzed and target score adjusted' });
};

exports.addEvent = (req, res) => {
    const { address, type, details } = req.body;
    if (!address || !type) return res.status(400).json({ error: 'Missing fields' });

    const user = persistence.getUser(address);
    if (type === 'TRANSACTION') user.transactions.push(details);
    if (type === 'COMPLAINT') user.complaints.push(details);

    persistence.updateUser(address, user);
    res.json({ message: 'Event recorded', address });
};
