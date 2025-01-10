const net = require('net');

class FlashDbClient {
    constructor(host = '127.0.0.1', port = 2006) {
        this.client = net.createConnection({ host, port });
    }

    sendCommand(command) {
        return new Promise((resolve, reject) => {
            this.client.once('data', (data) => resolve(data.toString().trim()));
            this.client.once('error', reject);
            this.client.write(`${command}\n`);
        });
    }

    async set(key, value, ttl) {
        return await this.sendCommand(`SET ${key} ${value} ${ttl}`);
    }

    async get(key) {
        return await this.sendCommand(`GET ${key}`);
    }

    async delete(key) {
        return await this.sendCommand(`DEL ${key}`);
    }

    async getAll() {
        return await this.sendCommand('ALL');
    }
}

module.exports = FlashDbClient;

// (async () => {
//     const client = new FlashDbClient();

//     const userSession = {
//         name: 'Troy',
//         email: 'iranzithierry12@gmail.com',
//         ttl: 60 // 60 seconds
//     }
//     const st = "Time taken to save session"
//     const gt = "Time taken to get session"

//     console.time(st);
//     await client.set('user:uuid:session', JSON.stringify(userSession), userSession.ttl);
//     console.timeEnd(st);

//     console.time(gt);
//     console.log("SESSION:", await client.get("user:uuid:session"));
//     console.timeEnd(gt) 

//     // console.log(await client.set('foo', 'bar', 10)); // OK
//     // console.log(await client.get('foo'));           // bar
//     // console.log(await client.getAll());            // foo
//     // console.log(await client.delete('foo'));      // DELETED

//     process.exit(0);
// })();