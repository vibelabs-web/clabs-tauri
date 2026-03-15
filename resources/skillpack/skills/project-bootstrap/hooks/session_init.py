#!/usr/bin/env python3
"""
Session Init Hook
Runs on SessionStart to initialize project context and load configurations.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime


def load_project_context(cwd: Path) -> dict:
    """Load project-specific context from CLAUDE.md files."""
    context = {
        "project_name": cwd.name,
        "has_claude_md": False,
        "has_agents": False,
        "tech_stack": [],
        "initialized_at": datetime.now().isoformat()
    }

    # Check for CLAUDE.md
    claude_md = cwd / "CLAUDE.md"
    if claude_md.exists():
        context["has_claude_md"] = True
        context["claude_md_path"] = str(claude_md)

    # Check for .claude/agents
    agents_dir = cwd / ".claude" / "agents"
    if agents_dir.exists():
        context["has_agents"] = True
        context["agents"] = [f.stem for f in agents_dir.glob("*.md")]

    # Detect tech stack
    tech_markers = {
        "package.json": "nodejs",
        "requirements.txt": "python",
        "pyproject.toml": "python",
        "Cargo.toml": "rust",
        "go.mod": "go",
        "Gemfile": "ruby",
        "Package.swift": "swift",
        "docker-compose.yml": "docker"
    }

    for marker, tech in tech_markers.items():
        if (cwd / marker).exists():
            context["tech_stack"].append(tech)

    return context


def main():
    cwd = Path.cwd()

    # Load project context
    context = load_project_context(cwd)

    # Output initialization message
    print(f"✅ Session initialized: {context['project_name']}")

    if context["has_agents"]:
        print(f"   Agents: {', '.join(context['agents'])}")

    if context["tech_stack"]:
        print(f"   Tech: {', '.join(context['tech_stack'])}")

    if context["has_claude_md"]:
        print(f"   📄 CLAUDE.md loaded")

    # Save context for other hooks
    cache_dir = Path.home() / ".claude" / "cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    cache_file = cache_dir / "session_context.json"
    with open(cache_file, 'w') as f:
        json.dump(context, f, indent=2)


if __name__ == "__main__":
    main()
