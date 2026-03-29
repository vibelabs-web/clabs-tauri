pub mod listener;
pub mod responder;

use crate::pty::PtyPoolManager;
use listener::IncomingSlackMessage;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};

pub struct SlackBridge {
    bot_token: String,
    shutdown_tx: Option<mpsc::Sender<()>>,
    pub message_rx: Arc<Mutex<mpsc::Receiver<IncomingSlackMessage>>>,
}

impl SlackBridge {
    /// Start the Slack Socket Mode bridge
    pub fn start(
        app_token: String,
        bot_token: String,
        bot_user_id: String,
        pty_pool: Arc<PtyPoolManager>,
    ) -> Self {
        let (shutdown_tx, shutdown_rx) = mpsc::channel::<()>(1);
        let (message_tx, message_rx) = mpsc::channel::<IncomingSlackMessage>(100);

        let token = bot_token.clone();

        tauri::async_runtime::spawn(async move {
            listener::run_socket_mode(
                app_token,
                token,
                bot_user_id,
                pty_pool,
                message_tx,
                shutdown_rx,
            )
            .await;
        });

        log::info!("[slack] SlackBridge started");

        Self {
            bot_token,
            shutdown_tx: Some(shutdown_tx),
            message_rx: Arc::new(Mutex::new(message_rx)),
        }
    }

    /// Get the bot token for sending messages
    pub fn bot_token(&self) -> &str {
        &self.bot_token
    }

    /// Stop the bridge
    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            tx.try_send(()).ok();
            log::info!("[slack] SlackBridge stopped");
        }
    }
}

impl Drop for SlackBridge {
    fn drop(&mut self) {
        self.stop();
    }
}
