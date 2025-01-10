# Redis Altenative implementation
A lightweight Redis-like key-value database implementation with a Rust backend and Node.js client.


## server Setup (Rust)

### installation Steps

Build and run the server:
```bash
cargo build
cargo run
```

The server will start listening on `localhost:2006`.

## client setu nodejs

1. Run the client:
```bash
node index.js
# bun index.js
```

## Usage Example

```javascript
(async () => {
    const client = new RedisClient();

    // set value
    const a = await client.set('username', "John", 60);
    console.log("SET:", a);
    
    // get value
    const b = await client.get('username');
    console.log("GET:", b);
    
    // get all values
    const c = await client.getAll();
    console.log("GET_ALL:", c);
    
    // delete the key
    const d = await client.delete('username');
    console.log("DELETE:", d);

    process.exit(0)
})();
```

## API Reference

### Client Methods

- `connect()`: connect to the server
- `set(key, value, ttl)`: store a value with optional TTL in seconds
- `get(key)`: retrieve a value by key
- `getAll()`: retrieve all stored values
- `delete(key)`: delete a key-value pair

## Contributing

Feel free to submit issues and enhancement requests!