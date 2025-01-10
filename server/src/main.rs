use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpListener;

#[derive(Clone)]
struct KeyValueStore {
    data: Arc<Mutex<HashMap<String, (String, Instant)>>>,
}

impl KeyValueStore {
    fn new() -> Self {
        KeyValueStore {
            data: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    async fn set(&self, key: String, value: String, ttl: Option<u64>) {
        let mut data = self.data.lock().unwrap();
        let expiration = ttl.map(|t| Instant::now() + Duration::from_secs(t));
        data.insert(
            key,
            (
                value,
                expiration.unwrap_or_else(|| Instant::now() + Duration::from_secs(u64::MAX)),
            ),
        );
    }

    async fn get(&self, key: &str) -> Option<String> {
        let mut data = self.data.lock().unwrap();
        if let Some((value, expiration)) = data.get(key) {
            if Instant::now() < *expiration {
                return Some(value.clone());
            } else {
                data.remove(key);
            }
        }
        None
    }

    async fn delete(&self, key: &str) -> bool {
        let mut data = self.data.lock().unwrap();
        data.remove(key).is_some()
    }

    async fn get_all(&self) -> Vec<String> {
        let mut expired_keys = HashSet::new();
        let mut data = self.data.lock().unwrap();
        let keys: Vec<String> = data
            .iter()
            .filter_map(|(key, (_, expiration))| {
                if Instant::now() < *expiration {
                    Some(key.clone())
                } else {
                    expired_keys.insert(key.clone());
                    None
                }
            })
            .collect();

        for key in expired_keys {
            data.remove(&key);
        }

        keys
    }

    async fn clean_expired(&self) {
        let mut data = self.data.lock().unwrap();
        let keys_to_remove: Vec<String> = data
            .iter()
            .filter_map(|(key, (_, expiration))| {
                if Instant::now() >= *expiration {
                    Some(key.clone())
                } else {
                    None
                }
            })
            .collect();
        for key in keys_to_remove {
            data.remove(&key);
        }
    }
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let store = KeyValueStore::new();
    let listener = TcpListener::bind("127.0.0.1:2006").await?;
    let store_for_cleaner = store.clone();

    // backgroud task to clean expired keys
    tokio::spawn(async move {
        loop {
            store_for_cleaner.clean_expired().await;
            tokio::time::sleep(Duration::from_secs(10)).await;
        }
    });

    loop {
        let (socket, _) = listener.accept().await?;
        let store = store.clone();

        tokio::spawn(async move {
            let mut reader = BufReader::new(socket);
            let mut buffer = String::new();

            while let Ok(bytes) = reader.read_line(&mut buffer).await {
                if bytes == 0 {
                    break;
                }

                let response = handle_request(&store, buffer.trim()).await;
                if let Err(e) = reader.get_mut().write_all(response.as_bytes()).await {
                    eprintln!("Failed to write response: {}", e);
                }
                buffer.clear();
            }
        });
    }
}

async fn handle_request(store: &KeyValueStore, request: &str) -> String {
    let parts: Vec<&str> = request.split_whitespace().collect();
    match parts.as_slice() {
        ["SET", key, value, ttl] => {
            let ttl = ttl.parse::<u64>().unwrap_or(0);
            store
                .set(key.to_string(), value.to_string(), Some(ttl))
                .await;
            "OK\n".to_string()
        }
        ["GET", key] => match store.get(key).await {
            Some(value) => format!("{}\n", value),
            None => "NULL\n".to_string(),
        },
        ["DEL", key] => {
            if store.delete(key).await {
                "DELETED\n".to_string()
            } else {
                "NOT_FOUND\n".to_string()
            }
        }
        ["ALL"] => {
            let keys = store.get_all().await;
            format!("{}\n", keys.join(","))
        }
        _ => "ERROR: Unknown command\n".to_string(),
    }
}
