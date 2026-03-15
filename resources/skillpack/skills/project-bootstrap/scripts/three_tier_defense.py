#!/usr/bin/env python3
"""
3-Tier Defense System
Proactive error prevention and recovery for implementation tasks.

Tier 1: Proactive Prevention - Detect tech stack, pre-load best practices
Tier 2: Fast Recovery - Pattern match errors, apply documented solutions
Tier 3: Deep Analysis - 7-step systematic debugging
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# =============================================================================
# TIER 1: PROACTIVE PREVENTION
# =============================================================================

TECH_STACK_PATTERNS = {
    # Databases
    "postgresql": ["postgresql", "postgres", "psycopg", "pgvector"],
    "mysql": ["mysql", "mariadb"],
    "mongodb": ["mongodb", "mongo", "pymongo"],
    "sqlite": ["sqlite"],
    "redis": ["redis"],

    # Backend
    "python": ["python", "pip", "requirements.txt", "pyproject.toml"],
    "fastapi": ["fastapi", "uvicorn"],
    "django": ["django"],
    "flask": ["flask"],
    "nodejs": ["node", "npm", "package.json", "yarn"],
    "express": ["express"],
    "rails": ["rails", "ruby", "gemfile", "bundle"],
    "rust": ["rust", "cargo", "cargo.toml"],
    "go": ["golang", "go.mod", "go.sum"],
    "swift": ["swift", "xcode", "package.swift"],
    "java": ["java", "maven", "gradle", "spring"],

    # Frontend
    "react": ["react", "jsx", "tsx"],
    "vue": ["vue", "nuxt"],
    "svelte": ["svelte", "sveltekit"],
    "nextjs": ["next.js", "nextjs", "next.config"],
    "angular": ["angular"],

    # Deployment
    "docker": ["docker", "dockerfile", "docker-compose"],
    "replit": ["replit", ".replit"],
    "vercel": ["vercel"],
    "railway": ["railway"],
}

BEST_PRACTICES = {
    "postgresql": {
        "connection": """
# PostgreSQL Connection Best Practice
from sqlalchemy import create_engine
import time

def get_connection(retries=3, delay=2):
    for attempt in range(retries):
        try:
            engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,    # Verify connection before use
                pool_recycle=300,      # Recycle connections every 5min
                pool_size=5,           # Connection pool size
                max_overflow=10        # Extra connections if needed
            )
            return engine.connect()
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(delay * (attempt + 1))
            else:
                raise
""",
        "env_vars": ["DATABASE_URL", "PGHOST", "PGUSER", "PGPASSWORD", "PGDATABASE"]
    },

    "fastapi": {
        "cors": """
# FastAPI CORS Configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
""",
        "error_handling": """
# FastAPI Error Handling
from fastapi import HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )
"""
    },

    "react": {
        "api_proxy": """
// React API Proxy (vite.config.ts)
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
""",
        "error_boundary": """
// React Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
"""
    },

    "docker": {
        "healthcheck": """
# Docker Healthcheck
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
""",
    },

    "replit": {
        "env_vars": """
# Replit Environment Variables
# Use Secrets tab (not .env file)
import os
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not set in Replit Secrets")
"""
    }
}


def detect_tech_stack(project_path: Path) -> List[str]:
    """Detect technologies used in the project."""
    detected = set()

    # Check common files
    files_to_check = [
        "package.json", "requirements.txt", "pyproject.toml",
        "Gemfile", "Cargo.toml", "go.mod", "Package.swift",
        "docker-compose.yml", "Dockerfile", ".replit",
        "vercel.json", "railway.json"
    ]

    for file_name in files_to_check:
        file_path = project_path / file_name
        if file_path.exists():
            try:
                content = file_path.read_text().lower()
                for tech, patterns in TECH_STACK_PATTERNS.items():
                    for pattern in patterns:
                        if pattern.lower() in content:
                            detected.add(tech)
            except:
                pass

    # Check file extensions
    extensions = {
        ".py": "python",
        ".js": "nodejs",
        ".ts": "nodejs",
        ".jsx": "react",
        ".tsx": "react",
        ".vue": "vue",
        ".svelte": "svelte",
        ".rb": "rails",
        ".rs": "rust",
        ".go": "go",
        ".swift": "swift",
        ".java": "java",
    }

    for ext, tech in extensions.items():
        if list(project_path.rglob(f"*{ext}")):
            detected.add(tech)

    return list(detected)


def get_best_practices(tech_stack: List[str]) -> Dict:
    """Get best practices for detected technologies."""
    practices = {}
    for tech in tech_stack:
        if tech in BEST_PRACTICES:
            practices[tech] = BEST_PRACTICES[tech]
    return practices


# =============================================================================
# TIER 2: FAST RECOVERY
# =============================================================================

ERROR_PATTERNS = {
    # Database errors
    r"Connection terminated unexpectedly": {
        "category": "database",
        "solution": "Add retry logic with exponential backoff",
        "code": "See BEST_PRACTICES['postgresql']['connection']"
    },
    r"ECONNREFUSED": {
        "category": "database",
        "solution": "Check if database is running and connection string is correct",
        "commands": ["docker compose ps", "docker compose up -d db"]
    },
    r"relation .* does not exist": {
        "category": "database",
        "solution": "Run database migrations",
        "commands": ["alembic upgrade head", "python manage.py migrate"]
    },
    r"authentication failed": {
        "category": "database",
        "solution": "Check database credentials in environment variables"
    },

    # Environment errors
    r"process\.env\..* undefined|KeyError:.*|not set": {
        "category": "environment",
        "solution": "Set environment variable in .env file or Replit Secrets"
    },
    r"CORS policy": {
        "category": "api",
        "solution": "Configure CORS in backend or use proxy in frontend",
        "code": "See BEST_PRACTICES['fastapi']['cors']"
    },

    # Dependency errors
    r"Module not found|ModuleNotFoundError|Cannot find module": {
        "category": "dependencies",
        "solution": "Install missing module",
        "commands": ["pip install <module>", "npm install <module>"]
    },
    r"Permission denied.*pip": {
        "category": "dependencies",
        "solution": "Use --user flag or virtual environment",
        "commands": ["pip install --user <package>", "python -m venv venv"]
    },

    # Build errors
    r"SyntaxError|Unexpected token": {
        "category": "build",
        "solution": "Check syntax in file mentioned in error"
    },
    r"TypeError:.*is not a function": {
        "category": "runtime",
        "solution": "Check import/export statements and package version"
    },
    r"Cannot read property.*of undefined|undefined is not an object": {
        "category": "runtime",
        "solution": "Add null check or optional chaining (?.) before accessing property"
    },

    # Docker errors
    r"port is already allocated": {
        "category": "docker",
        "solution": "Stop conflicting container or change port",
        "commands": ["docker compose down", "lsof -i :<port>"]
    },
    r"no space left on device": {
        "category": "docker",
        "solution": "Clean up Docker resources",
        "commands": ["docker system prune -a"]
    },

    # Git errors
    r"merge conflict": {
        "category": "git",
        "solution": "Resolve conflicts in marked files, then git add and commit"
    },
    r"rejected.*non-fast-forward": {
        "category": "git",
        "solution": "Pull latest changes first",
        "commands": ["git pull --rebase origin main"]
    },
}


def match_error(error_message: str) -> Optional[Dict]:
    """Match error message against known patterns."""
    for pattern, solution in ERROR_PATTERNS.items():
        if re.search(pattern, error_message, re.IGNORECASE):
            return {
                "pattern": pattern,
                **solution
            }
    return None


def suggest_fix(error_message: str) -> Dict:
    """Suggest a fix for the given error."""
    match = match_error(error_message)
    if match:
        return {
            "matched": True,
            "tier": 2,
            **match
        }
    return {
        "matched": False,
        "tier": 3,
        "suggestion": "No known pattern matched. Proceeding to Tier 3 Deep Analysis."
    }


# =============================================================================
# TIER 3: DEEP ANALYSIS
# =============================================================================

DEEP_ANALYSIS_STEPS = """
## 7-Step Systematic Debugging

### Step 1: Symptom Analysis
- Full error message: [paste here]
- Stack trace: [paste here]
- When it occurs: [always/sometimes/specific conditions]
- Recent changes: [what changed before error appeared]

### Step 2: Reproduction
- Minimal test case: [simplest way to reproduce]
- Exact trigger: [specific action/input]
- Reproduction steps:
  1. [step 1]
  2. [step 2]
  3. [error occurs]

### Step 3: Root Cause Tracing
- Execution path: [trace from entry to error]
- Variable states at failure: [relevant values]
- Where behavior diverges from expected: [specific location]

### Step 4: Hypothesis Formulation
- Hypothesis: "If [condition], then [behavior] because [reason]"
- Evidence supporting: [facts]
- Evidence against: [contradictions]

### Step 5: Fix Implementation
- Targeted fix: [minimal change]
- Addresses root cause: [yes/no]
- Side effects considered: [list]

### Step 6: Verification
- Test the fix: [pass/fail]
- Regression tests: [pass/fail]
- No new issues: [confirmed/issues found]

### Step 7: Documentation
- Root cause: [summary]
- Solution: [what was done]
- Prevention: [how to avoid in future]
"""


def generate_analysis_template(error_message: str) -> str:
    """Generate a deep analysis template for the error."""
    return f"""
# Deep Analysis Required

## Error Information
```
{error_message}
```

{DEEP_ANALYSIS_STEPS}

## Initial Analysis
- Error type: [identify from message]
- Likely category: [database/api/build/runtime/etc]
- Files to check: [based on stack trace]

## Recommended Actions
1. Add debug logging around the failure point
2. Check recent changes in git history
3. Test in isolation if possible
4. Search for similar issues in project history or online
"""


# =============================================================================
# MAIN FUNCTIONS
# =============================================================================

def tier1_prevention(project_path: Path) -> Dict:
    """Run Tier 1 Proactive Prevention."""
    tech_stack = detect_tech_stack(project_path)
    best_practices = get_best_practices(tech_stack)

    return {
        "tier": 1,
        "action": "prevention",
        "detected_stack": tech_stack,
        "best_practices": best_practices,
        "recommendation": f"Pre-apply best practices for: {', '.join(tech_stack)}"
    }


def tier2_recovery(error_message: str) -> Dict:
    """Run Tier 2 Fast Recovery."""
    return suggest_fix(error_message)


def tier3_analysis(error_message: str) -> Dict:
    """Run Tier 3 Deep Analysis."""
    return {
        "tier": 3,
        "action": "deep_analysis",
        "template": generate_analysis_template(error_message),
        "recommendation": "Follow 7-step debugging process"
    }


def defend(error_message: str = None, project_path: Path = None,
           tier: int = None) -> Dict:
    """
    Main defense function.
    Auto-selects appropriate tier based on input.
    """
    if project_path is None:
        project_path = Path.cwd()

    results = {"project_path": str(project_path)}

    # Tier 1: Always run if no specific error
    if not error_message or tier == 1:
        results["tier1"] = tier1_prevention(project_path)
        if not error_message:
            return results

    # Tier 2: Try to match error
    if error_message:
        tier2_result = tier2_recovery(error_message)
        results["tier2"] = tier2_result

        # If matched, return Tier 2 solution
        if tier2_result.get("matched"):
            return results

        # If not matched, escalate to Tier 3
        results["tier3"] = tier3_analysis(error_message)

    return results


def main():
    parser = argparse.ArgumentParser(
        description="3-Tier Defense System for error prevention and recovery"
    )
    parser.add_argument(
        "--path", "-p",
        default=".",
        help="Project path (default: current directory)"
    )
    parser.add_argument(
        "--error", "-e",
        help="Error message to analyze"
    )
    parser.add_argument(
        "--tier", "-t",
        type=int,
        choices=[1, 2, 3],
        help="Force specific tier (1=prevention, 2=recovery, 3=analysis)"
    )
    parser.add_argument(
        "--detect-stack",
        action="store_true",
        help="Only detect tech stack"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )

    args = parser.parse_args()

    # Read error from stdin if not provided
    error_message = args.error
    if not error_message and not sys.stdin.isatty():
        error_message = sys.stdin.read().strip()

    project_path = Path(args.path)

    if args.detect_stack:
        stack = detect_tech_stack(project_path)
        if args.json:
            print(json.dumps({"tech_stack": stack}))
        else:
            print("Detected Tech Stack:")
            for tech in stack:
                print(f"  - {tech}")
        return

    result = defend(error_message, project_path, args.tier)

    if args.json:
        # Remove non-serializable parts for JSON output
        if "tier3" in result and "template" in result["tier3"]:
            result["tier3"]["template"] = "[template available]"
        print(json.dumps(result, indent=2))
    else:
        print("\n" + "=" * 60)
        print("3-TIER DEFENSE SYSTEM ANALYSIS")
        print("=" * 60)

        if "tier1" in result:
            print("\n[TIER 1: PROACTIVE PREVENTION]")
            print(f"Detected Stack: {', '.join(result['tier1']['detected_stack'])}")
            if result['tier1']['best_practices']:
                print("Best Practices Available:")
                for tech in result['tier1']['best_practices']:
                    print(f"  - {tech}")

        if "tier2" in result:
            print("\n[TIER 2: FAST RECOVERY]")
            t2 = result["tier2"]
            if t2.get("matched"):
                print(f"Pattern Matched: {t2['pattern']}")
                print(f"Category: {t2['category']}")
                print(f"Solution: {t2['solution']}")
                if "commands" in t2:
                    print("Suggested Commands:")
                    for cmd in t2["commands"]:
                        print(f"  $ {cmd}")
            else:
                print("No pattern matched - escalating to Tier 3")

        if "tier3" in result:
            print("\n[TIER 3: DEEP ANALYSIS]")
            print(result["tier3"]["template"])


if __name__ == "__main__":
    main()
