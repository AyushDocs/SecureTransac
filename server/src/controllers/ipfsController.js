const ipfsService = require('../services/ipfsService');
const fs = require('fs');

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        console.log(`[IPFS] Uploading file: ${req.file.originalname}`);
        const result = await ipfsService.pinFile(req.file.path, {
            pinataMetadata: {
                name: req.file.originalname,
                keyvalues: {
                    uploadedBy: req.body.userAddress || 'anonymous'
                }
            }
        });
        
        // Cleanup local file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Failed to delete temp file:", err);
        });
        
        res.json({ success: true, cid: result.IpfsHash, ...result });
    } catch (error) {
        console.error("IPFS Upload Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.pinJSON = async (req, res) => {
    try {
        const body = req.body;
        const result = await ipfsService.pinJSON(body, {
             pinataMetadata: {
                name: `Metadata-${Date.now()}`
             }
        });
        res.json({ success: true, cid: result.IpfsHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
