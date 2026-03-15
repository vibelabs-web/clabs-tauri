#!/usr/bin/env python3
"""
MCP Server Setup Script
Configures MCP servers (Context7, Playwright) for Claude Code projects.
"""

import argparse
import json
import platform
import sys
from pathlib import Path

# Default MCP server configurations
# defer_loading: true enables Tool Search (85% token reduction)
# https://www.anthropic.com/engineering/advanced-tool-use
DEFAULT_MCP_SERVERS = {
    "context7": {
        "command": "npx",
        "args": ["-y", "@upstash/context7-mcp@latest"],
        "defer_loading": True
    },
    "playwright": {
        "command": "npx",
        "args": ["-y", "@playwright/mcp@latest"],
        "defer_loading": True
    }
}

# Gemini MCP binary paths (Rust implementation)
GEMINI_MCP_BINARY = {
    "darwin": "gemini-mcp-rs/target/release/gemini-mcp",       # macOS
    "linux": "gemini-mcp-rs/target/release/gemini-mcp",        # Linux
    "windows": "gemini-mcp-rs/target/release/gemini-mcp.exe"   # Windows
}


def get_gemini_config(skills_root: Path = None) -> dict:
    """Get Gemini MCP configuration based on platform.

    Priority:
    1. Rust binary (high-performance, 1MB, 10ms startup)
    2. Fallback to npx (deprecated, but works)
    """
    system = platform.system().lower()

    # Try to find Rust binary
    if skills_root:
        binary_name = GEMINI_MCP_BINARY.get(system, GEMINI_MCP_BINARY["linux"])
        binary_path = skills_root.parent.parent.parent / binary_name

        if binary_path.exists():
            return {
                "command": str(binary_path.resolve()),
                "args": ["--model", "gemini-3-pro-preview"],
                "defer_loading": True,
                "description": "Gemini 3 Pro Preview (Rust) - 고성능 MCP 서버"
            }

    # No binary found - return None to indicate unavailable
    return None


# Optional MCP servers that can be added
# Note: gemini will be added dynamically in setup_mcp() if binary exists
OPTIONAL_MCP_SERVERS = {
    "github": {
        "command": "npx",
        "args": ["-y", "@anthropic/github-mcp@latest"],
        "env": {
            "GITHUB_TOKEN": "${GITHUB_TOKEN}"
        },
        "defer_loading": True
    },
    "postgres": {
        "command": "npx",
        "args": ["-y", "@anthropic/postgres-mcp@latest"],
        "env": {
            "DATABASE_URL": "${DATABASE_URL}"
        },
        "defer_loading": True
    },
    "filesystem": {
        "command": "npx",
        "args": ["-y", "@anthropic/filesystem-mcp@latest", "--root", "."],
        "defer_loading": True
    }
}


def load_existing_settings(settings_path: Path) -> dict:
    """Load existing settings.json if it exists."""
    if settings_path.exists():
        try:
            with open(settings_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"  Warning: Could not parse existing {settings_path}, creating new one")
    return {}


def merge_mcp_servers(existing: dict, new_servers: dict) -> dict:
    """Merge new MCP servers with existing ones, preserving user customizations."""
    existing_mcp = existing.get("mcpServers", {})

    for server_name, server_config in new_servers.items():
        if server_name not in existing_mcp:
            existing_mcp[server_name] = server_config
            print(f"  Added: {server_name}")
        else:
            print(f"  Skipped (already exists): {server_name}")

    existing["mcpServers"] = existing_mcp
    return existing


def setup_mcp(project_path: Path, servers: list[str] = None, include_optional: list[str] = None):
    """Set up MCP servers for the project."""
    claude_dir = project_path / ".claude"
    mcp_json_path = project_path / ".mcp.json"  # Claude Code uses .mcp.json for MCP servers

    # Find skills root for Rust binary detection
    skills_root = Path(__file__).parent.parent  # .claude/skills/project-bootstrap

    print(f"\n{'='*50}")
    print("Setting up MCP servers")
    print(f"Path: {project_path}")
    print(f"Platform: {platform.system()}")
    print(f"{'='*50}\n")

    # Create .claude directory if it doesn't exist
    claude_dir.mkdir(parents=True, exist_ok=True)

    # Update gemini config dynamically based on platform and binary availability
    gemini_config = get_gemini_config(skills_root)
    if gemini_config:
        OPTIONAL_MCP_SERVERS["gemini"] = gemini_config
    elif "gemini" in OPTIONAL_MCP_SERVERS:
        del OPTIONAL_MCP_SERVERS["gemini"]

    # Determine which servers to configure
    servers_to_add = {}

    if servers:
        # User specified specific servers
        for server in servers:
            if server in DEFAULT_MCP_SERVERS:
                servers_to_add[server] = DEFAULT_MCP_SERVERS[server].copy()
            elif server in OPTIONAL_MCP_SERVERS:
                servers_to_add[server] = OPTIONAL_MCP_SERVERS[server].copy()
            else:
                print(f"  Warning: Unknown server '{server}', skipping")
    else:
        # Use default servers
        servers_to_add = {k: v.copy() for k, v in DEFAULT_MCP_SERVERS.items()}

    # Add optional servers if requested
    if include_optional:
        for server in include_optional:
            if server == "gemini" and server not in OPTIONAL_MCP_SERVERS:
                print(f"  Warning: Gemini MCP 바이너리를 찾을 수 없습니다.")
                print(f"           빌드 필요: cd gemini-mcp-rs && cargo build --release")
            elif server in OPTIONAL_MCP_SERVERS:
                servers_to_add[server] = OPTIONAL_MCP_SERVERS[server].copy()
            else:
                print(f"  Warning: Unknown optional server '{server}', skipping")

    # Remove description field (not part of MCP spec)
    for server_config in servers_to_add.values():
        server_config.pop("description", None)

    # Load existing .mcp.json and merge
    existing_mcp = load_existing_settings(mcp_json_path)
    updated_mcp = merge_mcp_servers(existing_mcp, servers_to_add)

    # Write .mcp.json (Claude Code's MCP server config file)
    with open(mcp_json_path, 'w') as f:
        json.dump(updated_mcp, f, indent=2)

    print(f"\n{'='*50}")
    print(f"MCP setup complete!")
    print(f"Config saved to: {mcp_json_path}")
    print(f"{'='*50}\n")

    # Print configured servers
    print("Configured MCP servers:")
    for server_name in updated_mcp.get("mcpServers", {}).keys():
        print(f"  - {server_name}")

    # Special instructions for gemini
    if "gemini" in updated_mcp.get("mcpServers", {}):
        gemini_server = updated_mcp["mcpServers"]["gemini"]
        is_rust_binary = not gemini_server.get("command", "").startswith("npx")

        print("\n[Gemini MCP 설정 완료]")
        if is_rust_binary:
            print("  - 백엔드: Rust 바이너리 (고성능, 1MB, 10ms 시작)")
        else:
            print("  - 백엔드: npx (OAuth 인증 필요)")
        print("  - 모델: gemini-3-pro-preview")
        print("  - 할당량: 60 req/분, 1,000 req/일 (무료)")
        print("  - 첫 실행 시 브라우저에서 Google 로그인 필요")
        print("  - Claude Code 재시작 후 MCP 서버가 활성화됩니다")


def list_servers():
    """List all available MCP servers."""
    print("\nDefault MCP servers (always included):")
    for name, config in DEFAULT_MCP_SERVERS.items():
        cmd = " ".join([config["command"]] + config["args"])
        print(f"  - {name}: {cmd}")

    print("\nOptional MCP servers (use --include):")

    # Check Gemini availability
    gemini_config = get_gemini_config(Path(__file__).parent.parent)
    if gemini_config:
        cmd = " ".join([gemini_config["command"]] + gemini_config["args"])
        print(f"  - gemini: Gemini 3 Pro Preview (Rust 바이너리)")
        print(f"      {cmd}")
    else:
        print(f"  - gemini: (사용 불가 - 빌드 필요)")
        print(f"      cd gemini-mcp-rs && cargo build --release")

    for name, config in OPTIONAL_MCP_SERVERS.items():
        cmd = " ".join([config["command"]] + config["args"])
        desc = config.get("description", "")
        env_note = ""
        if "env" in config and not desc:
            env_vars = ", ".join(config["env"].keys())
            env_note = f" (requires: {env_vars})"
        if desc:
            print(f"  - {name}: {desc}")
            print(f"      {cmd}")
        else:
            print(f"  - {name}: {cmd}{env_note}")


def main():
    parser = argparse.ArgumentParser(description="Set up MCP servers for Claude Code")
    parser.add_argument(
        "--path", "-p",
        default=".",
        help="Project path (default: current directory)"
    )
    parser.add_argument(
        "--servers", "-s",
        nargs="+",
        help="Specific servers to configure (default: context7, playwright)"
    )
    parser.add_argument(
        "--include", "-i",
        nargs="+",
        help="Include optional servers (github, postgres, filesystem)"
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List all available MCP servers"
    )

    args = parser.parse_args()

    if args.list:
        list_servers()
        return

    setup_mcp(Path(args.path), args.servers, args.include)


if __name__ == "__main__":
    main()
