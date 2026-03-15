#!/usr/bin/env python3
"""
Frontend Project Setup Script
Initializes frontend project structure based on the specified framework.
Supports --with-auth option to include authentication UI templates.
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent.resolve()
TEMPLATES_DIR = SCRIPT_DIR.parent / "templates" / "frontend"

# Auth template file mappings (template_name -> target_path)
REACT_VITE_AUTH_FILES = {
    "types_auth.ts": "src/types/auth.ts",
    "services_api.ts": "src/services/api.ts",
    "services_auth.ts": "src/services/auth.ts",
    "stores_auth.ts": "src/stores/auth.ts",
    "components_ProtectedRoute.tsx": "src/components/auth/ProtectedRoute.tsx",
    "pages_LoginPage.tsx": "src/pages/LoginPage.tsx",
    "pages_RegisterPage.tsx": "src/pages/RegisterPage.tsx",
    "pages_ProfilePage.tsx": "src/pages/ProfilePage.tsx",
}

NEXTJS_AUTH_FILES = {
    "types_auth.ts": "src/types/auth.ts",
    "lib_auth.ts": "src/lib/auth.ts",
    "services_auth.ts": "src/services/auth.ts",
    "stores_auth.ts": "src/stores/auth.ts",
    "components_AuthProvider.tsx": "src/components/AuthProvider.tsx",
    "components_ProtectedRoute.tsx": "src/components/ProtectedRoute.tsx",
    "app_login_page.tsx": "src/app/login/page.tsx",
    "app_register_page.tsx": "src/app/register/page.tsx",
    "app_profile_page.tsx": "src/app/profile/page.tsx",
}

SVELTEKIT_AUTH_FILES = {
    "types_auth.ts": "src/lib/types/auth.ts",
    "lib_auth.ts": "src/lib/auth.ts",
    "routes_login_page.svelte": "src/routes/login/+page.svelte",
    "routes_register_page.svelte": "src/routes/register/+page.svelte",
    "routes_profile_page.svelte": "src/routes/profile/+page.svelte",
    "hooks_server.ts": "src/hooks.server.ts",
}

REMIX_AUTH_FILES = {
    "types_auth.ts": "app/types/auth.ts",
    "services_session.server.ts": "app/services/session.server.ts",
    "services_auth.server.ts": "app/services/auth.server.ts",
    "routes_login.tsx": "app/routes/login.tsx",
    "routes_register.tsx": "app/routes/register.tsx",
    "routes_profile.tsx": "app/routes/profile.tsx",
}

FRAMEWORKS = {
    "react-vite": {
        "commands": [
            ["npm", "create", "vite@latest", ".", "--", "--template", "react-ts"],
            ["npm", "install"],
            ["npm", "install", "react-router-dom", "@tanstack/react-query", "axios", "zustand"],
            ["npm", "install", "-D", "tailwindcss", "postcss", "autoprefixer"],
        ],
        "post_commands": [
            ["npx", "tailwindcss", "init", "-p"],
        ],
        "structure": {
            "src/components": [],
            "src/hooks": [],
            "src/pages": [],
            "src/services": [],
            "src/stores": [],
            "src/types": [],
            "src/utils": [],
        },
        "files": {
            "src/services/api.ts": '''import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
''',
            ".env.example": "VITE_API_URL=http://localhost:8000\n",
        },
    },
    "nextjs": {
        "commands": [
            ["npx", "create-next-app@latest", ".", "--typescript", "--tailwind", "--eslint", "--app", "--src-dir", "--no-import-alias"],
        ],
        "post_commands": [
            ["npm", "install", "@tanstack/react-query", "axios", "zustand"],
        ],
        "structure": {
            "src/components": [],
            "src/hooks": [],
            "src/services": [],
            "src/stores": [],
            "src/types": [],
        },
        "files": {
            "src/services/api.ts": '''import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
''',
            ".env.local.example": "NEXT_PUBLIC_API_URL=http://localhost:8000\n",
        },
    },
    "vue": {
        "commands": [
            ["npm", "create", "vue@latest", ".", "--", "--typescript", "--router", "--pinia"],
            ["npm", "install"],
            ["npm", "install", "axios", "@tanstack/vue-query"],
            ["npm", "install", "-D", "tailwindcss", "postcss", "autoprefixer"],
        ],
        "post_commands": [
            ["npx", "tailwindcss", "init", "-p"],
        ],
        "structure": {
            "src/components": [],
            "src/composables": [],
            "src/services": [],
            "src/types": [],
        },
        "files": {
            "src/services/api.ts": '''import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
''',
            ".env.example": "VITE_API_URL=http://localhost:8000\n",
        },
    },
    "sveltekit": {
        "commands": [
            ["npx", "sv", "create", ".", "--template", "minimal", "--types", "ts"],
            ["npm", "install"],
            ["npx", "sv", "add", "tailwindcss"],
        ],
        "post_commands": [],
        "structure": {
            "src/lib/components": [],
            "src/lib/services": [],
            "src/lib/stores": [],
            "src/lib/types": [],
            "src/routes/login": [],
            "src/routes/register": [],
            "src/routes/profile": [],
        },
        "files": {
            "src/lib/services/api.ts": '''const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}
''',
            ".env.example": "VITE_API_URL=http://localhost:8000\n",
        },
    },
    "remix": {
        "commands": [
            ["npx", "create-remix@latest", ".", "--template", "remix-run/remix/templates/remix", "--no-git-init", "--no-install"],
            ["npm", "install"],
            ["npm", "install", "-D", "tailwindcss", "postcss", "autoprefixer"],
        ],
        "post_commands": [
            ["npx", "tailwindcss", "init", "-p"],
        ],
        "structure": {
            "app/components": [],
            "app/services": [],
            "app/types": [],
            "app/utils": [],
        },
        "files": {
            "app/services/api.server.ts": '''const API_URL = process.env.API_URL || 'http://localhost:8000';

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}
''',
            ".env.example": "API_URL=http://localhost:8000\nSESSION_SECRET=your-secret-key-change-in-production\n",
        },
    },
    "angular": {
        "commands": [
            ["npx", "@angular/cli", "new", "app", "--directory", ".", "--style", "scss", "--routing", "--ssr", "false"],
            ["npm", "install", "axios"],
        ],
        "post_commands": [],
        "structure": {
            "src/app/components": [],
            "src/app/services": [],
            "src/app/models": [],
            "src/app/guards": [],
        },
        "files": {
            "src/environments/environment.ts": '''export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'
};
''',
        },
    },
}


def run_command(cmd: list, cwd: Path, interactive: bool = False) -> bool:
    """Execute a shell command."""
    try:
        print(f"  Running: {' '.join(cmd)}")
        if interactive:
            result = subprocess.run(cmd, cwd=cwd)
        else:
            result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"  Error: {result.stderr}")
                return False
        return result.returncode == 0
    except FileNotFoundError:
        print(f"  Command not found: {cmd[0]}")
        return False


def create_structure(base_path: Path, structure: dict):
    """Create directory structure."""
    for directory, files in structure.items():
        dir_path = base_path / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        for file in files:
            file_path = dir_path / file
            if not file_path.exists():
                file_path.touch()


def create_files(base_path: Path, files: dict):
    """Create files with content."""
    for file_path, content in files.items():
        full_path = base_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        if not full_path.exists():
            full_path.write_text(content)


def setup_auth_files(framework: str, project_path: Path):
    """Copy authentication UI template files to project."""
    auth_file_mappings = {
        "react-vite": (REACT_VITE_AUTH_FILES, "react-vite"),
        "nextjs": (NEXTJS_AUTH_FILES, "nextjs"),
        "sveltekit": (SVELTEKIT_AUTH_FILES, "sveltekit"),
        "remix": (REMIX_AUTH_FILES, "remix"),
    }

    if framework not in auth_file_mappings:
        print(f"  Auth UI templates not available for {framework}")
        return False

    file_map, template_dir_name = auth_file_mappings[framework]
    auth_templates_dir = TEMPLATES_DIR / template_dir_name / "auth"

    if not auth_templates_dir.exists():
        print(f"  Warning: Auth templates not found at {auth_templates_dir}")
        return False

    print("Setting up authentication UI files...")
    for template_name, target_path in file_map.items():
        src = auth_templates_dir / template_name
        dst = project_path / target_path
        if src.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            print(f"  Created: {target_path}")
        else:
            print(f"  Warning: Template not found: {template_name}")

    return True


def setup_frontend(framework: str, project_path: Path, skip_install: bool = False, with_auth: bool = False):
    """Set up frontend project."""
    if framework not in FRAMEWORKS:
        print(f"Unknown framework: {framework}")
        print(f"Available: {', '.join(FRAMEWORKS.keys())}")
        sys.exit(1)

    config = FRAMEWORKS[framework]
    print(f"\n{'='*50}")
    print(f"Setting up {framework} frontend project")
    print(f"Path: {project_path}")
    print(f"{'='*50}\n")

    # Create project directory
    project_path.mkdir(parents=True, exist_ok=True)

    # Run main commands (often interactive)
    if not skip_install and config["commands"]:
        print("Running setup commands...")
        for cmd in config["commands"]:
            # create commands are often interactive
            interactive = "create" in cmd[1] if len(cmd) > 1 else False
            if not run_command(cmd, project_path, interactive=interactive):
                print(f"Warning: Command failed, continuing...")

    # Create additional structure
    if config["structure"]:
        print("Creating additional directory structure...")
        create_structure(project_path, config["structure"])

    # Create additional files
    if config["files"]:
        print("Creating additional files...")
        create_files(project_path, config["files"])

    # Run post commands
    if not skip_install and config.get("post_commands"):
        print("Running post-setup commands...")
        for cmd in config["post_commands"]:
            if not run_command(cmd, project_path):
                print(f"Warning: Command failed, continuing...")

    # Setup auth files if requested
    if with_auth:
        setup_auth_files(framework, project_path)

    print(f"\n{'='*50}")
    print(f"Frontend setup complete!")
    if with_auth:
        print(f"Authentication UI templates included!")
    print(f"{'='*50}\n")


def main():
    parser = argparse.ArgumentParser(description="Set up frontend project")
    parser.add_argument(
        "--framework", "-f",
        choices=list(FRAMEWORKS.keys()),
        help="Frontend framework to use"
    )
    parser.add_argument(
        "--path", "-p",
        default="./frontend",
        help="Project path (default: ./frontend)"
    )
    parser.add_argument(
        "--skip-install",
        action="store_true",
        help="Skip package installation"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available frameworks"
    )
    parser.add_argument(
        "--with-auth",
        action="store_true",
        help="Include authentication UI templates (login, register, profile)"
    )

    args = parser.parse_args()

    if args.list:
        auth_supported = {"react-vite", "nextjs", "sveltekit", "remix"}
        print("Available frameworks:")
        for name in FRAMEWORKS.keys():
            auth_support = "✓ auth" if name in auth_supported else ""
            print(f"  - {name} {auth_support}")
        return

    if not args.framework:
        parser.error("--framework/-f is required when not using --list")

    setup_frontend(args.framework, Path(args.path), args.skip_install, args.with_auth)


if __name__ == "__main__":
    main()
