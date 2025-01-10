const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

class SQLClient {
    constructor() {
        db.run(`CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            value TEXT,
            expiry INTEGER
        )`);
    }

    set(key, value, ttl) {
        return new Promise((resolve, reject) => {
            const expiry = ttl ? Date.now() + (ttl * 1000) : null;
            db.run('INSERT OR REPLACE INTO cache (key, value, expiry) VALUES (?, ?, ?)', 
                [key, value, expiry], 
                (err) => err ? reject(err) : resolve('OK'));
        });
    }

    get(key) {
        return new Promise((resolve, reject) => {
            db.get('SELECT value, expiry FROM cache WHERE key = ?', [key], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                if (row.expiry && row.expiry < Date.now()) {
                    this.delete(key);
                    return resolve(null);
                }
                resolve(row.value);
            });
        });
    }
}

module.exports = SQLClient;