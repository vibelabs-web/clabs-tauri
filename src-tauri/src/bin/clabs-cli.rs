//! clabs CLI — Inter-pane orchestration tool for Clabs terminal
//!
//! Communicates with the Clabs app via Unix domain socket.
//! Usage:
//!   clabs pane list
//!   clabs pane send <pane_id> "message"
//!   clabs pane send <pane_id> --file /path/to/file.md
//!   clabs pane read <pane_id> [--lines N]
//!   clabs pane wait-response <pane_id> [--timeout SEC] [--cli-type TYPE]
//!   clabs pane get-response <pane_id> "message" [--timeout SEC] [--cli-type TYPE]

use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::UnixStream;
use std::path::PathBuf;

#[derive(Serialize)]
struct Request {
    id: String,
    action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pane_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    timeout_ms: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cli_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_lines: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    direction: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    instance_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cmux_target: Option<String>,
}

#[derive(Deserialize)]
struct Response {
    #[allow(dead_code)]
    id: String,
    ok: bool,
    data: Option<serde_json::Value>,
    error: Option<String>,
}

fn get_socket_path() -> PathBuf {
    if let Ok(path) = std::env::var("CLABS_SOCKET") {
        PathBuf::from(path)
    } else {
        let home = dirs::home_dir().unwrap_or_default();
        home.join(".clabs").join("sock")
    }
}

fn send_request(req: Request) -> Result<Response, String> {
    let socket_path = get_socket_path();

    let mut stream = UnixStream::connect(&socket_path)
        .map_err(|e| format!("Cannot connect to Clabs ({}): {}\nIs Clabs running?", socket_path.display(), e))?;

    // Set read timeout for long operations
    stream.set_read_timeout(Some(std::time::Duration::from_secs(300))).ok();

    let mut json = serde_json::to_string(&req).unwrap();
    json.push('\n');
    stream.write_all(json.as_bytes()).map_err(|e| format!("Write error: {}", e))?;
    stream.flush().map_err(|e| format!("Flush error: {}", e))?;

    let mut reader = BufReader::new(stream);
    let mut line = String::new();
    reader.read_line(&mut line).map_err(|e| format!("Read error: {}", e))?;

    serde_json::from_str::<Response>(&line).map_err(|e| format!("Parse error: {}", e))
}

fn print_usage() {
    eprintln!("clabs — Inter-pane orchestration CLI for Clabs terminal");
    eprintln!();
    eprintln!("Usage:");
    eprintln!("  clabs pane list                                    List active panes");
    eprintln!("  clabs pane send <target> \"message\"                 Send text + Enter");
    eprintln!("  clabs pane type <target> \"text\"                   Type text (no Enter)");
    eprintln!("  clabs pane keys <target> <key>                    Send key (Enter/Escape/Ctrl+C/...)");
    eprintln!("  clabs pane read <target> [--lines N]              Read recent output");
    eprintln!("  clabs pane split <target> [--direction DIR]       Split pane");
    eprintln!("  clabs pane resolve <name>                         Resolve name to pane_id");
    eprintln!("  clabs pane wait-response <target> [OPTIONS]       Wait for response");
    eprintln!("  clabs pane get-response <target> \"msg\" [OPTIONS]  Send + wait + return");
    eprintln!();
    eprintln!("Target can be a pane_id or a pane name (e.g. 'Terminal 2', 'Builder').");
    eprintln!();
    eprintln!("Cross-instance:");
    eprintln!("  clabs instances                                   List all running Clabs instances");
    eprintln!("  clabs send-to <instance_id> <target> \"msg\"        Send to another Clabs instance");
    eprintln!("  clabs cmux <cmux_target> \"msg\"                    Send to cmux surface");
    eprintln!();
    eprintln!("Options:");
    eprintln!("  --timeout <SEC>     Timeout in seconds (default: 120)");
    eprintln!("  --cli-type <TYPE>   CLI type: claude, gemini, codex, generic (default: generic)");
    eprintln!("  --lines <N>         Number of lines to read (default: 100)");
    eprintln!();
    eprintln!("Environment:");
    eprintln!("  CLABS_SOCKET        Socket path (default: ~/.clabs/sock)");
    eprintln!("  CLABS_PANE_ID       Current pane ID (set by Clabs)");
}

fn parse_flag<'a>(args: &'a [String], flag: &str) -> Option<&'a str> {
    args.iter()
        .position(|a| a == flag)
        .and_then(|i| args.get(i + 1))
        .map(|s| s.as_str())
}

/// Parse target as either pane_id (starts with "pane-") or name
fn parse_target(target: &str) -> (Option<String>, Option<String>) {
    if target.starts_with("pane-") {
        (Some(target.to_string()), None)
    } else {
        (None, Some(target.to_string()))
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        print_usage();
        std::process::exit(1);
    }

    // Top-level commands (not under "pane")
    match args[1].as_str() {
        "instances" => {
            let result = send_request(Request { id: "cli-1".into(), action: "list-instances".into(), pane_id: None, name: None, message: None, key: None, timeout_ms: None, cli_type: None, max_lines: None, direction: None, instance_id: None, cmux_target: None });
            return print_result(result);
        }
        "send-to" => {
            if args.len() < 5 { eprintln!("Usage: clabs send-to <instance_id> <target> \"message\""); std::process::exit(1); }
            let instance_id = args[2].clone();
            let (pane_id, name) = parse_target(&args[3]);
            let message = args[4].clone();
            let result = send_request(Request { id: "cli-1".into(), action: "send-external".into(), pane_id, name, message: Some(message), key: None, timeout_ms: None, cli_type: None, max_lines: None, direction: None, instance_id: Some(instance_id), cmux_target: None });
            return print_result(result);
        }
        "cmux" => {
            if args.len() < 4 { eprintln!("Usage: clabs cmux <cmux_target> \"message\""); std::process::exit(1); }
            let cmux_target = args[2].clone();
            let message = args[3].clone();
            let result = send_request(Request { id: "cli-1".into(), action: "send-cmux".into(), pane_id: None, name: None, message: Some(message), key: None, timeout_ms: None, cli_type: None, max_lines: None, direction: None, instance_id: None, cmux_target: Some(cmux_target) });
            return print_result(result);
        }
        "pane" => {} // fall through to pane subcommands
        _ => {
            if args.len() < 3 { print_usage(); std::process::exit(1); }
        }
    }

    if args[1] != "pane" || args.len() < 3 {
        print_usage();
        std::process::exit(1);
    }

    let subcommand = &args[2];

    let result = match subcommand.as_str() {
        "list" => {
            let req = Request {
                id: "cli-1".into(),
                action: "list-panes".into(),
                pane_id: None, name: None,
                message: None, key: None,
                timeout_ms: None, cli_type: None,
                max_lines: None, direction: None,
                instance_id: None, cmux_target: None,
            };
            send_request(req)
        }

        "send" => {
            if args.len() < 4 { eprintln!("Usage: clabs pane send <target> \"message\""); std::process::exit(1); }
            let (pane_id, name) = parse_target(&args[3]);
            let message = if let Some(path) = parse_flag(&args, "--file") {
                std::fs::read_to_string(path).unwrap_or_else(|e| { eprintln!("Cannot read file: {}", e); std::process::exit(1); })
            } else if args.len() > 4 && !args[4].starts_with('-') { args[4].clone() }
            else { eprintln!("Message or --file required"); std::process::exit(1); };

            send_request(Request { id: "cli-1".into(), action: "send".into(), pane_id, name, message: Some(message), key: None, timeout_ms: None, cli_type: None, max_lines: None, direction: None, instance_id: None, cmux_target: None })
        }

        "type" => {
            if args.len() < 5 { eprintln!("Usage: clabs pane type <target> \"text\""); std::process::exit(1); }
            let (pane_id, name) = parse_target(&args[3]);
            let message = args[4].clone();
            send_request(Request { id: "cli-1".into(), action: "type".into(), pane_id, name, message: Some(message), key: None, timeout_ms: None, cli_type: None, max_lines: None, direction: None, instance_id: None, cmux_target: None })
        }

        "keys" => {
            if args.len() < 5 { eprintln!("Usage: clabs pane keys <target> <key>"); std::process::exit(1); }
            let (pane_id, name) = parse_target(&args[3]);
            let key = args[4].clone();
            send_request(Request { id: "cli-1".into(), action: "keys".into(), pane_id, name, message: None, key: Some(key), timeout_ms: None, cli_type: None, max_lines: None, direction: None, instance_id: None, cmux_target: None })
        }

        "resolve" => {
            if args.len() < 4 { eprintln!("Usage: clabs pane resolve <name>"); std::process::exit(1); }
            let resolve_name = args[3].clone();
            send_request(Request { id: "cli-1".into(), action: "resolve".into(), pane_id: None, name: Some(resolve_name), message: None, key: None, timeout_ms: None, cli_type: None, max_lines: None, direction: None, instance_id: None, cmux_target: None })
        }

        "read" => {
            if args.len() < 4 { eprintln!("Usage: clabs pane read <target> [--lines N]"); std::process::exit(1); }
            let (pane_id, name) = parse_target(&args[3]);
            let max_lines = parse_flag(&args, "--lines").and_then(|s| s.parse::<usize>().ok()).unwrap_or(100);
            send_request(Request { id: "cli-1".into(), action: "read-buffer".into(), pane_id, name, message: None, key: None, timeout_ms: None, cli_type: None, max_lines: Some(max_lines), direction: None, instance_id: None, cmux_target: None })
        }

        "split" => {
            if args.len() < 4 { eprintln!("Usage: clabs pane split <target> [--direction DIR]"); std::process::exit(1); }
            let (pane_id, name) = parse_target(&args[3]);
            let direction = parse_flag(&args, "--direction").unwrap_or("horizontal").to_string();
            send_request(Request { id: "cli-1".into(), action: "split".into(), pane_id, name, message: None, key: None, timeout_ms: None, cli_type: None, max_lines: None, direction: Some(direction), instance_id: None, cmux_target: None })
        }

        "wait-response" => {
            if args.len() < 4 { eprintln!("Usage: clabs pane wait-response <target> [--timeout SEC] [--cli-type TYPE]"); std::process::exit(1); }
            let (pane_id, name) = parse_target(&args[3]);
            let timeout_sec = parse_flag(&args, "--timeout").and_then(|s| s.parse::<u64>().ok()).unwrap_or(120);
            let cli_type = parse_flag(&args, "--cli-type").unwrap_or("generic").to_string();
            send_request(Request { id: "cli-1".into(), action: "wait-response".into(), pane_id, name, message: None, key: None, timeout_ms: Some(timeout_sec * 1000), cli_type: Some(cli_type), max_lines: None, direction: None, instance_id: None, cmux_target: None })
        }

        "get-response" => {
            if args.len() < 5 { eprintln!("Usage: clabs pane get-response <target> \"msg\" [--timeout SEC] [--cli-type TYPE]"); std::process::exit(1); }
            let (pane_id, name) = parse_target(&args[3]);
            let message = if let Some(path) = parse_flag(&args, "--file") {
                std::fs::read_to_string(path).unwrap_or_else(|e| { eprintln!("Cannot read file: {}", e); std::process::exit(1); })
            } else { args[4].clone() };
            let timeout_sec = parse_flag(&args, "--timeout").and_then(|s| s.parse::<u64>().ok()).unwrap_or(120);
            let cli_type = parse_flag(&args, "--cli-type").unwrap_or("generic").to_string();
            send_request(Request { id: "cli-1".into(), action: "get-response".into(), pane_id, name, message: Some(message), key: None, timeout_ms: Some(timeout_sec * 1000), cli_type: Some(cli_type), max_lines: None, direction: None, instance_id: None, cmux_target: None })
        }

        _ => {
            eprintln!("Unknown subcommand: {}", subcommand);
            print_usage();
            std::process::exit(1);
        }
    };

    print_result(result);
}

fn print_result(result: Result<Response, String>) {
    match result {
        Ok(resp) => {
            if resp.ok {
                if let Some(data) = resp.data {
                    println!("{}", serde_json::to_string_pretty(&data).unwrap());
                }
            } else {
                eprintln!("Error: {}", resp.error.unwrap_or_default());
                std::process::exit(1);
            }
        }
        Err(e) => {
            eprintln!("{}", e);
            std::process::exit(1);
        }
    }
}
