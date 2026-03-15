#!/usr/bin/env python3
"""
Defense-in-Depth: Auto-backup before dangerous operations.
Automatically creates git commits/pushes before destructive commands.
"""

import argparse
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from typing import Tuple, Optional

# Risk levels and their corresponding actions
RISK_LEVELS = {
    "SAFE": 0,
    "MODERATE": 1,
    "DANGEROUS": 2,
    "CRITICAL": 3
}

# Dangerous command patterns
DANGEROUS_PATTERNS = {
    # CRITICAL - Could cause irreversible data loss
    "rm -rf /": "CRITICAL",
    "rm -rf ~": "CRITICAL",
    "rm -rf *": "CRITICAL",
    "sudo rm": "CRITICAL",
    "format": "CRITICAL",
    "mkfs": "CRITICAL",
    "dd if=": "CRITICAL",
    "> /dev/": "CRITICAL",
    "chmod -R 777 /": "CRITICAL",
    "chown -R": "CRITICAL",

    # DANGEROUS - Could cause significant changes
    "rm -rf": "DANGEROUS",
    "rm -r": "DANGEROUS",
    "git reset --hard": "DANGEROUS",
    "git clean -fd": "DANGEROUS",
    "git push --force": "DANGEROUS",
    "git push -f": "DANGEROUS",
    "drop database": "DANGEROUS",
    "drop table": "DANGEROUS",
    "truncate": "DANGEROUS",
    "docker system prune": "DANGEROUS",
    "docker volume rm": "DANGEROUS",
    "npm cache clean --force": "DANGEROUS",

    # MODERATE - Should be noted
    "git checkout --": "MODERATE",
    "git stash drop": "MODERATE",
    "rm ": "MODERATE",
    "mv ": "MODERATE",
}


def analyze_command(command: str) -> Tuple[str, str]:
    """
    Analyze a command and return its risk level and matched pattern.
    Returns: (risk_level, matched_pattern)
    """
    command_lower = command.lower()

    # Check from most dangerous to least
    for pattern, level in sorted(DANGEROUS_PATTERNS.items(),
                                  key=lambda x: RISK_LEVELS.get(x[1], 0),
                                  reverse=True):
        if pattern.lower() in command_lower:
            return level, pattern

    return "SAFE", ""


def is_git_repo(path: Path) -> bool:
    """Check if the path is inside a git repository."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--is-inside-work-tree"],
            cwd=path,
            capture_output=True,
            text=True
        )
        return result.returncode == 0 and result.stdout.strip() == "true"
    except:
        return False


def get_git_status(path: Path) -> Tuple[bool, int]:
    """
    Get git status.
    Returns: (has_changes, num_changes)
    """
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=path,
            capture_output=True,
            text=True
        )
        changes = [l for l in result.stdout.strip().split('\n') if l]
        return len(changes) > 0, len(changes)
    except:
        return False, 0


def create_backup_commit(path: Path, command: str, risk_level: str) -> bool:
    """Create a backup commit before dangerous operation."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    commit_msg = f"🛡️ Defense-in-Depth backup [{risk_level}]\n\nBefore: {command[:100]}\nTimestamp: {timestamp}"

    try:
        # Stage all changes
        subprocess.run(["git", "add", "-A"], cwd=path, capture_output=True)

        # Create commit
        result = subprocess.run(
            ["git", "commit", "-m", commit_msg, "--allow-empty"],
            cwd=path,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print(f"  ├── ✅ Backup commit created")
            return True
        else:
            print(f"  ├── ⚠️ No changes to commit (working tree clean)")
            return True  # Still okay to proceed

    except Exception as e:
        print(f"  ├── ❌ Failed to create backup: {e}")
        return False


def push_backup(path: Path, remote: str = "origin", branch: str = None) -> bool:
    """Push backup to remote."""
    try:
        # Get current branch if not specified
        if not branch:
            result = subprocess.run(
                ["git", "branch", "--show-current"],
                cwd=path,
                capture_output=True,
                text=True
            )
            branch = result.stdout.strip() or "main"

        result = subprocess.run(
            ["git", "push", remote, branch],
            cwd=path,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print(f"  ├── ✅ Pushed to {remote}/{branch}")
            return True
        else:
            print(f"  ├── ⚠️ Push failed (may need manual push): {result.stderr[:100]}")
            return False

    except Exception as e:
        print(f"  ├── ❌ Push error: {e}")
        return False


def create_file_backup(path: Path, target_path: str) -> Optional[Path]:
    """Create a file backup for non-git scenarios."""
    try:
        backup_dir = Path.home() / ".claude-backups" / datetime.now().strftime("%Y%m%d")
        backup_dir.mkdir(parents=True, exist_ok=True)

        target = Path(target_path)
        if target.exists():
            timestamp = datetime.now().strftime("%H%M%S")
            backup_path = backup_dir / f"{target.name}_{timestamp}"

            if target.is_dir():
                import shutil
                shutil.copytree(target, backup_path)
            else:
                import shutil
                shutil.copy2(target, backup_path)

            print(f"  ├── ✅ File backup: {backup_path}")
            return backup_path

    except Exception as e:
        print(f"  ├── ⚠️ File backup failed: {e}")

    return None


def defend(command: str, path: Path = None, force: bool = False) -> dict:
    """
    Main defense function.
    Analyzes command and takes appropriate protective action.

    Returns: {
        "risk_level": str,
        "pattern": str,
        "action_taken": str,
        "safe_to_proceed": bool
    }
    """
    if path is None:
        path = Path.cwd()

    risk_level, pattern = analyze_command(command)
    result = {
        "risk_level": risk_level,
        "pattern": pattern,
        "action_taken": "none",
        "safe_to_proceed": True
    }

    if risk_level == "SAFE":
        return result

    print(f"\n🛡️ Defense-in-Depth: {risk_level} command detected")
    print(f"  ├── Pattern: {pattern}")
    print(f"  ├── Command: {command[:80]}...")

    # Check if git repo
    if is_git_repo(path):
        has_changes, num_changes = get_git_status(path)

        if risk_level == "CRITICAL":
            print(f"  ├── 🚨 CRITICAL: Creating backup commit + push")

            if has_changes:
                if create_backup_commit(path, command, risk_level):
                    result["action_taken"] = "commit"
                    push_backup(path)
                    result["action_taken"] = "commit+push"
            else:
                print(f"  ├── ℹ️ No uncommitted changes to backup")
                result["action_taken"] = "none_needed"

            if not force:
                print(f"  └── ⚠️ CRITICAL operation requires --force flag")
                result["safe_to_proceed"] = False
                return result

        elif risk_level == "DANGEROUS":
            print(f"  ├── ⚠️ DANGEROUS: Creating backup commit")

            if has_changes:
                if create_backup_commit(path, command, risk_level):
                    result["action_taken"] = "commit"
            else:
                print(f"  ├── ℹ️ No uncommitted changes to backup")
                result["action_taken"] = "none_needed"

        elif risk_level == "MODERATE":
            print(f"  ├── ℹ️ MODERATE: Noted (no backup needed)")
            result["action_taken"] = "logged"

    else:
        # Not a git repo - use file backup for dangerous operations
        if risk_level in ["CRITICAL", "DANGEROUS"]:
            print(f"  ├── ⚠️ Not a git repo - attempting file backup")

            # Try to extract target path from command
            parts = command.split()
            for part in reversed(parts):
                if not part.startswith("-") and "/" in part or "." in part:
                    create_file_backup(path, part)
                    result["action_taken"] = "file_backup"
                    break

    print(f"  └── ✅ Safe to proceed")
    return result


def main():
    parser = argparse.ArgumentParser(
        description="Defense-in-Depth: Auto-backup before dangerous operations"
    )
    parser.add_argument(
        "command",
        nargs="?",
        help="Command to analyze"
    )
    parser.add_argument(
        "--path", "-p",
        default=".",
        help="Project path (default: current directory)"
    )
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="Force execution of CRITICAL commands"
    )
    parser.add_argument(
        "--analyze-only", "-a",
        action="store_true",
        help="Only analyze, don't take action"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )

    args = parser.parse_args()

    if not args.command:
        # Read from stdin if no command provided
        command = sys.stdin.read().strip()
    else:
        command = args.command

    if not command:
        print("Error: No command provided")
        sys.exit(1)

    if args.analyze_only:
        risk_level, pattern = analyze_command(command)
        if args.json:
            import json
            print(json.dumps({"risk_level": risk_level, "pattern": pattern}))
        else:
            print(f"Risk Level: {risk_level}")
            if pattern:
                print(f"Pattern: {pattern}")
        sys.exit(0)

    result = defend(command, Path(args.path), args.force)

    if args.json:
        import json
        print(json.dumps(result))

    sys.exit(0 if result["safe_to_proceed"] else 1)


if __name__ == "__main__":
    main()
