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
    eprintln!("  clabs pane send <pane_id> \"message\"                Send text to a pane");
    eprintln!("  clabs pane send <pane_id> --file <path>            Send file content to a pane");
    eprintln!("  clabs pane read <pane_id> [--lines N]              Read recent output (default 100)");
    eprintln!("  clabs pane split <pane_id> [--direction DIR]      Split pane (horizontal/vertical)");
    eprintln!("  clabs pane wait-response <pane_id> [OPTIONS]       Wait for CLI response");
    eprintln!("  clabs pane get-response <pane_id> \"msg\" [OPTIONS]  Send + wait + return response");
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

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 3 {
        print_usage();
        std::process::exit(1);
    }

    if args[1] != "pane" {
        eprintln!("Unknown command: {}", args[1]);
        print_usage();
        std::process::exit(1);
    }

    let subcommand = &args[2];

    let result = match subcommand.as_str() {
        "list" => {
            let req = Request {
                id: "cli-1".into(),
                action: "list-panes".into(),
                pane_id: None,
                message: None,
                timeout_ms: None,
                cli_type: None,
                max_lines: None,
                direction: None,
            };
            send_request(req)
        }

        "send" => {
            if args.len() < 4 {
                eprintln!("Usage: clabs pane send <pane_id> \"message\" | --file <path>");
                std::process::exit(1);
            }
            let pane_id = args[3].clone();
            let message = if let Some(path) = parse_flag(&args, "--file") {
                std::fs::read_to_string(path).unwrap_or_else(|e| {
                    eprintln!("Cannot read file {}: {}", path, e);
                    std::process::exit(1);
                })
            } else if args.len() > 4 && !args[4].starts_with('-') {
                args[4].clone()
            } else {
                eprintln!("Message or --file required");
                std::process::exit(1);
            };

            let req = Request {
                id: "cli-1".into(),
                action: "send".into(),
                pane_id: Some(pane_id),
                message: Some(message),
                timeout_ms: None,
                cli_type: None,
                max_lines: None,
                direction: None,
            };
            send_request(req)
        }

        "read" => {
            if args.len() < 4 {
                eprintln!("Usage: clabs pane read <pane_id> [--lines N]");
                std::process::exit(1);
            }
            let pane_id = args[3].clone();
            let max_lines = parse_flag(&args, "--lines")
                .and_then(|s| s.parse::<usize>().ok())
                .unwrap_or(100);

            let req = Request {
                id: "cli-1".into(),
                action: "read-buffer".into(),
                pane_id: Some(pane_id),
                message: None,
                timeout_ms: None,
                cli_type: None,
                max_lines: Some(max_lines),
                direction: None,
            };
            send_request(req)
        }

        "split" => {
            if args.len() < 4 {
                eprintln!("Usage: clabs pane split <pane_id> [--direction horizontal|vertical]");
                std::process::exit(1);
            }
            let pane_id = args[3].clone();
            let direction = parse_flag(&args, "--direction")
                .unwrap_or("horizontal")
                .to_string();

            let req = Request {
                id: "cli-1".into(),
                action: "split".into(),
                pane_id: Some(pane_id),
                message: None,
                timeout_ms: None,
                cli_type: None,
                max_lines: None,
                direction: Some(direction),
            };
            send_request(req)
        }

        "wait-response" => {
            if args.len() < 4 {
                eprintln!("Usage: clabs pane wait-response <pane_id> [--timeout SEC] [--cli-type TYPE]");
                std::process::exit(1);
            }
            let pane_id = args[3].clone();
            let timeout_sec = parse_flag(&args, "--timeout")
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(120);
            let cli_type = parse_flag(&args, "--cli-type")
                .unwrap_or("generic")
                .to_string();

            let req = Request {
                id: "cli-1".into(),
                action: "wait-response".into(),
                pane_id: Some(pane_id),
                message: None,
                timeout_ms: Some(timeout_sec * 1000),
                cli_type: Some(cli_type),
                max_lines: None,
                direction: None,
            };
            send_request(req)
        }

        "get-response" => {
            if args.len() < 5 {
                eprintln!("Usage: clabs pane get-response <pane_id> \"message\" [--timeout SEC] [--cli-type TYPE]");
                std::process::exit(1);
            }
            let pane_id = args[3].clone();
            let message = if let Some(path) = parse_flag(&args, "--file") {
                std::fs::read_to_string(path).unwrap_or_else(|e| {
                    eprintln!("Cannot read file {}: {}", path, e);
                    std::process::exit(1);
                })
            } else {
                args[4].clone()
            };
            let timeout_sec = parse_flag(&args, "--timeout")
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(120);
            let cli_type = parse_flag(&args, "--cli-type")
                .unwrap_or("generic")
                .to_string();

            let req = Request {
                id: "cli-1".into(),
                action: "get-response".into(),
                pane_id: Some(pane_id),
                message: Some(message),
                timeout_ms: Some(timeout_sec * 1000),
                cli_type: Some(cli_type),
                max_lines: None,
                direction: None,
            };
            send_request(req)
        }

        _ => {
            eprintln!("Unknown subcommand: {}", subcommand);
            print_usage();
            std::process::exit(1);
        }
    };

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
