const SQLClient = require('./sql'); 
const FlashDbClient = require('../client/index');

const sqlClient = new SQLClient(); 
const flashDbClient = new FlashDbClient();

async function runComparison() {
    const iterations = 1000;
    const testData = {
        user: {
            id: 1,
            name: "Test User",
            email: "test@example.com"
        },
        ttl: 3600
    };
    console.log("Started comparison")


    // Write Test
    console.time('FlashDB Write Test');
    for (let i = 0; i < iterations; i++) {
        await flashDbClient.set(`user:${i}`, JSON.stringify(testData), testData.ttl);
    }
    console.timeEnd('FlashDB Write Test');

    console.time('SQLite Write Test');
    for (let i = 0; i < iterations; i++) {
        await sqlClient.set(`user:${i}`, JSON.stringify(testData), testData.ttl);
    }
    console.timeEnd('SQLite Write Test');


    // Read Test
    console.time('FlashDB Read Test');
    for (let i = 0; i < iterations; i++) {
        await flashDbClient.get(`user:${i}`);
    }
    console.timeEnd('FlashDB Read Test');

    console.time('SQLite Read Test');
    for (let i = 0; i < iterations; i++) {
        await sqlClient.get(`user:${i}`);
    }
    console.timeEnd('SQLite Read Test');

    process.exit(0);
}

runComparison();
