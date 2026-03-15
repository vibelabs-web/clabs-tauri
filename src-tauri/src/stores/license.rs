use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

const SERVICE_NAME: &str = "com.claudelabs.clabs";
const ACCOUNT_NAME: &str = "license";
const VALIDATION_API: &str = "https://api.claudelabs.com/api/license/validate";

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct License {
    pub key: String,
    pub activated_at: String,
    pub expires_at: String,
    pub upgrade_expires_at: String,
    pub email: String,
    pub machine_id: String,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LicenseValidationResult {
    pub is_valid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remaining_days: Option<u32>,
}

pub struct LicenseStore {
    cached_key: Mutex<Option<String>>,
}

impl LicenseStore {
    pub fn new() -> Self {
        Self {
            cached_key: Mutex::new(None),
        }
    }

    pub fn set(&self, license: &str) -> Result<(), String> {
        let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME)
            .map_err(|e| format!("Keyring error: {}", e))?;
        entry
            .set_password(license)
            .map_err(|e| format!("Failed to store license: {}", e))?;
        *self.cached_key.lock().unwrap() = Some(license.to_string());
        Ok(())
    }

    pub fn get(&self) -> Option<String> {
        // Check cache first
        {
            let cached = self.cached_key.lock().unwrap();
            if cached.is_some() {
                return cached.clone();
            }
        }

        let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME).ok()?;
        match entry.get_password() {
            Ok(key) => {
                *self.cached_key.lock().unwrap() = Some(key.clone());
                Some(key)
            }
            Err(_) => None,
        }
    }

    pub async fn validate(&self, key: &str) -> bool {
        let client = reqwest::Client::new();
        match client
            .post(VALIDATION_API)
            .json(&serde_json::json!({"license": key}))
            .send()
            .await
        {
            Ok(resp) => {
                if let Ok(data) = resp.json::<serde_json::Value>().await {
                    data.get("valid").and_then(|v| v.as_bool()).unwrap_or(false)
                } else {
                    false
                }
            }
            Err(_) => false,
        }
    }

    pub fn delete(&self) {
        if let Ok(entry) = Entry::new(SERVICE_NAME, ACCOUNT_NAME) {
            entry.delete_credential().ok();
        }
        *self.cached_key.lock().unwrap() = None;
    }
}
