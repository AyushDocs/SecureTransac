const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server/data/db.json');

try {
    if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        // Remove trustScore from all users
        if (data.users) {
            Object.keys(data.users).forEach(addr => {
                if (data.users[addr].trustScore !== undefined) {
                    delete data.users[addr].trustScore;
                }
            });
        }
        
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        console.log("Successfully removed trust scores from db.json");
    } else {
        console.log("db.json not found");
    }
} catch (e) {
    console.error("Error cleaning db:", e);
}
