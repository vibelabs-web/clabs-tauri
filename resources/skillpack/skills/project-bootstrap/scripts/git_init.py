#!/usr/bin/env python3
"""
Git Initialization Script
Initializes git repository with initial commit and optional .gitignore.
"""

import argparse
import subprocess
import sys
from pathlib import Path


GITIGNORE_TEMPLATES = {
    "python": """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
.venv/
ENV/
.env
*.egg-info/
dist/
build/
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/
.ruff_cache/
""",
    "node": """# Node
node_modules/
dist/
build/
.next/
.nuxt/
.output/
.env
.env.local
.env.*.local
*.log
npm-debug.log*
.DS_Store
coverage/
""",
    "ruby": """# Ruby
*.gem
*.rbc
/.config
/coverage/
/InstalledFiles
/pkg/
/spec/reports/
/test/tmp/
/test/version_tmp/
/tmp/
.env
/log/*.log
/tmp
/vendor/bundle
.byebug_history
""",
    "java": """# Java
*.class
*.jar
*.war
*.ear
*.log
target/
.gradle/
build/
.idea/
*.iml
.env
""",
    "go": """# Go
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
go.work
vendor/
.env
""",
    "fullstack": """# Dependencies
node_modules/
venv/
.venv/
vendor/

# Build outputs
dist/
build/
.next/
__pycache__/
*.py[cod]
*.egg-info/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*

# Testing
coverage/
htmlcov/
.pytest_cache/
.coverage

# Misc
tmp/
temp/
""",
}


def run_command(cmd: list, cwd: Path) -> tuple[bool, str]:
    """Execute a shell command and return success status and output."""
    try:
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            return False, result.stderr
        return True, result.stdout
    except FileNotFoundError:
        return False, f"Command not found: {cmd[0]}"


def create_gitignore(project_path: Path, template: str):
    """Create .gitignore file from template."""
    if template not in GITIGNORE_TEMPLATES:
        print(f"Unknown template: {template}")
        print(f"Available: {', '.join(GITIGNORE_TEMPLATES.keys())}")
        return False

    gitignore_path = project_path / ".gitignore"

    # Append to existing or create new
    if gitignore_path.exists():
        existing = gitignore_path.read_text()
        new_content = existing + "\n" + GITIGNORE_TEMPLATES[template]
    else:
        new_content = GITIGNORE_TEMPLATES[template]

    gitignore_path.write_text(new_content)
    print(f"  Created/Updated .gitignore with {template} template")
    return True


def git_init(
    project_path: Path,
    message: str = "Initial commit",
    gitignore_template: str = None,
    branch: str = "main"
):
    """Initialize git repository with initial commit."""
    print(f"\n{'='*50}")
    print(f"Initializing Git repository")
    print(f"Path: {project_path}")
    print(f"{'='*50}\n")

    # Check if already a git repo
    git_dir = project_path / ".git"
    if git_dir.exists():
        print("  Git repository already exists")
        response = input("  Reinitialize? (y/N): ").strip().lower()
        if response != 'y':
            print("  Skipping git init")
            return

    # Create .gitignore if template specified
    if gitignore_template:
        create_gitignore(project_path, gitignore_template)

    # Git init
    print("  Running: git init")
    success, output = run_command(["git", "init", "-b", branch], project_path)
    if not success:
        print(f"  Error: {output}")
        sys.exit(1)

    # Git add
    print("  Running: git add .")
    success, output = run_command(["git", "add", "."], project_path)
    if not success:
        print(f"  Error: {output}")
        sys.exit(1)

    # Git commit
    print(f"  Running: git commit -m \"{message}\"")
    success, output = run_command(["git", "commit", "-m", message], project_path)
    if not success:
        # Check if nothing to commit
        if "nothing to commit" in output:
            print("  Nothing to commit")
        else:
            print(f"  Error: {output}")
            sys.exit(1)

    # Show status
    print("\n  Git log:")
    success, output = run_command(["git", "log", "--oneline", "-1"], project_path)
    if success:
        print(f"    {output.strip()}")

    print(f"\n{'='*50}")
    print(f"Git initialization complete!")
    print(f"{'='*50}\n")


def main():
    parser = argparse.ArgumentParser(description="Initialize git repository")
    parser.add_argument(
        "--path", "-p",
        default=".",
        help="Project path (default: current directory)"
    )
    parser.add_argument(
        "--message", "-m",
        default="Initial commit",
        help="Initial commit message"
    )
    parser.add_argument(
        "--gitignore", "-g",
        choices=list(GITIGNORE_TEMPLATES.keys()),
        help="Gitignore template to use"
    )
    parser.add_argument(
        "--branch", "-b",
        default="main",
        help="Default branch name (default: main)"
    )
    parser.add_argument(
        "--list-templates",
        action="store_true",
        help="List available gitignore templates"
    )

    args = parser.parse_args()

    if args.list_templates:
        print("Available gitignore templates:")
        for name in GITIGNORE_TEMPLATES.keys():
            print(f"  - {name}")
        return

    git_init(
        Path(args.path),
        message=args.message,
        gitignore_template=args.gitignore,
        branch=args.branch
    )


if __name__ == "__main__":
    main()
