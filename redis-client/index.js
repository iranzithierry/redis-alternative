const net = require('net');

class RedisClient {
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

(async () => {
    const client = new RedisClient();

    const userSession = {
        name: 'Troy',
        age: 19,
        email: 'iranzithierry12@gmail.com',
        ttl: 60 // 60 seconds
    }
    const st = "Time taken to save session"
    const gt = "Time taken to get session"

    console.time(st);
    await client.set('user:1:session', JSON.stringify(userSession), userSession.ttl);
    console.timeEnd(st);

    console.time(gt);
    console.log("SESSION:", await client.get("user:1:session"));
    console.timeEnd(gt) 

    // console.log(await client.set('foo', 'bar', 10)); // OK
    // console.log(await client.get('foo'));           // bar
    // console.log(await client.getAll());            // foo
    // console.log(await client.delete('foo'));      // DELETED

    process.exit(0);
})();
