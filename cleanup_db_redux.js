const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server/data/db.json');

try {
    if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        // Fields to remove from user objects
        const fieldsToRemove = [
            'transactions', 
            'complaints', 
            'trustScore', 
            'identityCid', 
            'name', 
            'email', 
            'description',
            'companyName'
        ];
        
        let removedCount = 0;

        if (data.users) {
            Object.keys(data.users).forEach(addr => {
                const user = data.users[addr];
                fieldsToRemove.forEach(field => {
                    if (user[field] !== undefined) {
                        delete user[field];
                        removedCount++;
                    }
                });
            });
        }
        
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        console.log(`Successfully cleaned db.json. Removed ${removedCount} fields across users.`);
        console.log("Retained fields (e.g. role) remain.");
    } else {
        console.log("db.json not found");
    }
} catch (e) {
    console.error("Error cleaning db:", e);
}
