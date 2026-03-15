#!/usr/bin/env python3
"""
Backend Project Setup Script
Initializes backend project structure based on the specified framework.
Supports --with-auth option to include authentication templates.
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent.resolve()
TEMPLATES_DIR = SCRIPT_DIR.parent / "templates" / "backend"

# Auth template file mappings (template_name -> target_path)
FASTAPI_AUTH_FILES = {
    "models_user.py": "app/models/user.py",
    "schemas_auth.py": "app/schemas/auth.py",
    "schemas_user.py": "app/schemas/user.py",
    "core_security.py": "app/core/security.py",
    "core_deps.py": "app/core/deps.py",
    "services_auth.py": "app/services/auth.py",
    "api_auth.py": "app/api/v1/auth.py",
    "api_users.py": "app/api/v1/users.py",
    "main_with_auth.py": "app/main.py",
}

EXPRESS_AUTH_FILES = {
    "types_auth.ts": "src/types/auth.ts",
    "config_auth.ts": "src/config/auth.ts",
    "services_auth.ts": "src/services/auth.ts",
    "middleware_auth.ts": "src/middleware/auth.ts",
    "routes_auth.ts": "src/routes/auth.ts",
    "routes_users.ts": "src/routes/users.ts",
    "app_with_auth.ts": "src/app.ts",
}

RAILS_AUTH_FILES = {
    "models_user.rb": "app/models/user.rb",
    "models_session.rb": "app/models/session.rb",
    "models_current.rb": "app/models/current.rb",
    "services_json_web_token.rb": "app/services/json_web_token.rb",
    "controllers_application_controller.rb": "app/controllers/application_controller.rb",
    "controllers_auth_controller.rb": "app/controllers/api/v1/auth_controller.rb",
    "controllers_users_controller.rb": "app/controllers/api/v1/users_controller.rb",
    "routes_auth.rb": "config/routes.rb",
    "migrate_create_users.rb": "db/migrate/20240101000000_create_users.rb",
    "migrate_create_sessions.rb": "db/migrate/20240101000001_create_sessions.rb",
}

# Rails 8 config files (non-auth, general setup)
RAILS_CONFIG_FILES = {
    "config_database.yml": "config/database.yml",
    "app_assets_stylesheets_application.css": "app/assets/stylesheets/application.css",
}


FRAMEWORKS = {
    "fastapi": {
        "language": "python",
        "commands": [
            ["python3", "-m", "venv", "venv"],
            ["venv/bin/pip", "install", "fastapi", "uvicorn[standard]", "pydantic", "pydantic-settings", "python-dotenv"],
        ],
        "db_commands": [
            ["venv/bin/pip", "install", "sqlalchemy[asyncio]", "asyncpg", "alembic", "pgvector"],
        ],
        "auth_commands": [
            ["venv/bin/pip", "install", "python-jose[cryptography]", "passlib[bcrypt]"],
        ],
        "structure": {
            "app": ["__init__.py", "main.py"],
            "app/api": ["__init__.py"],
            "app/api/v1": ["__init__.py", "endpoints.py"],
            "app/models": ["__init__.py"],
            "app/schemas": ["__init__.py"],
            "app/services": ["__init__.py"],
            "app/core": ["__init__.py", "config.py", "security.py"],
            "app/db": ["__init__.py", "session.py", "base.py"],
            "tests": ["__init__.py", "conftest.py"],
            "alembic/versions": [],
        },
        "files": {
            "app/main.py": '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
''',
            "app/core/config.py": '''from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"
    SECRET_KEY: str = "changeme"

    class Config:
        env_file = ".env"

settings = Settings()
''',
            "app/db/session.py": '''from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
''',
            "app/db/base.py": '''from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
''',
            "alembic.ini": '''[alembic]
script_location = alembic
prepend_sys_path = .
sqlalchemy.url = postgresql+asyncpg://postgres:postgres@localhost:5432/app

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
''',
            "alembic/env.py": '''from logging.config import fileConfig
import asyncio
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.db.base import Base
from app.core.config import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

def run_migrations_online():
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
''',
            "alembic/script.py.mako": '''"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}

def upgrade() -> None:
    ${upgrades if upgrades else "pass"}

def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
''',
            ".env.example": "DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app\nSECRET_KEY=changeme\n",
            "requirements.txt": "fastapi\nuvicorn[standard]\npydantic\npydantic-settings\npython-dotenv\nsqlalchemy[asyncio]\nasyncpg\nalembic\npgvector\npython-jose[cryptography]\npasslib[bcrypt]\n",
        },
    },
    "django": {
        "language": "python",
        "commands": [
            ["python3", "-m", "venv", "venv"],
            ["venv/bin/pip", "install", "django", "djangorestframework", "python-dotenv"],
            ["venv/bin/django-admin", "startproject", "config", "."],
        ],
        "structure": {},
        "files": {
            ".env.example": "DEBUG=True\nSECRET_KEY=\nDATABASE_URL=\n",
        },
    },
    "express": {
        "language": "node",
        "commands": [
            ["npm", "init", "-y"],
            ["npm", "install", "express", "cors", "dotenv", "helmet"],
            ["npm", "install", "-D", "typescript", "@types/node", "@types/express", "ts-node", "nodemon"],
        ],
        "auth_commands": [
            ["npm", "install", "bcrypt", "jsonwebtoken"],
            ["npm", "install", "-D", "@types/bcrypt", "@types/jsonwebtoken"],
        ],
        "structure": {
            "src": ["index.ts", "app.ts"],
            "src/routes": [],
            "src/controllers": [],
            "src/models": [],
            "src/middleware": [],
            "src/config": [],
            "src/services": [],
            "src/types": [],
        },
        "files": {
            "src/index.ts": '''import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
''',
            "src/app.ts": '''import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

export default app;
''',
            "tsconfig.json": '''{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
''',
            ".env.example": "PORT=3000\nJWT_SECRET=your-secret-key-change-in-production\nDATABASE_URL=\n",
        },
    },
    "spring-boot": {
        "language": "java",
        "commands": [],
        "note": "Use Spring Initializr: https://start.spring.io or 'curl https://start.spring.io/starter.zip -o demo.zip'",
        "structure": {},
        "files": {},
    },
    "go-fiber": {
        "language": "go",
        "commands": [
            ["go", "mod", "init", "app"],
            ["go", "get", "github.com/gofiber/fiber/v2"],
        ],
        "structure": {
            "cmd/api": [],
            "internal/handlers": [],
            "internal/models": [],
            "internal/routes": [],
            "pkg": [],
        },
        "files": {
            "main.go": '''package main

import (
	"log"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New()
	app.Use(cors.New())

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy"})
	})

	log.Fatal(app.Listen(":3000"))
}
''',
        },
    },
    "go-echo": {
        "language": "go",
        "commands": [
            ["go", "mod", "init", "app"],
            ["go", "get", "github.com/labstack/echo/v4"],
            ["go", "get", "github.com/labstack/echo/v4/middleware"],
        ],
        "auth_commands": [
            ["go", "get", "github.com/golang-jwt/jwt/v5"],
            ["go", "get", "golang.org/x/crypto/bcrypt"],
        ],
        "structure": {
            "cmd/api": [],
            "internal/handlers": [],
            "internal/models": [],
            "internal/routes": [],
            "internal/middleware": [],
            "internal/config": [],
            "pkg/utils": [],
        },
        "files": {
            "main.go": '''package main

import (
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch},
	}))

	// Health check
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
	})

	// API v1 group
	v1 := e.Group("/api/v1")
	v1.GET("/ping", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"message": "pong"})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":" + port))
}
''',
            "internal/config/config.go": '''package config

import "os"

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
''',
            "internal/handlers/health.go": '''package handlers

import (
	"net/http"
	"github.com/labstack/echo/v4"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Check(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "healthy",
		"version": "1.0.0",
	})
}
''',
            "internal/routes/routes.go": '''package routes

import (
	"app/internal/handlers"
	"github.com/labstack/echo/v4"
)

func Setup(e *echo.Echo) {
	healthHandler := handlers.NewHealthHandler()

	// Health routes
	e.GET("/health", healthHandler.Check)

	// API v1
	v1 := e.Group("/api/v1")
	setupV1Routes(v1)
}

func setupV1Routes(g *echo.Group) {
	// Add your API routes here
}
''',
            ".env.example": '''PORT=8080
DATABASE_URL=postgres://user:password@localhost:5432/dbname?sslmode=disable
JWT_SECRET=your-secret-key-change-in-production
''',
            "Makefile": '''APP_NAME=app
BUILD_DIR=./bin

.PHONY: build run dev test clean

build:
	go build -o $(BUILD_DIR)/$(APP_NAME) ./main.go

run: build
	$(BUILD_DIR)/$(APP_NAME)

dev:
	go run main.go

test:
	go test -v ./...

clean:
	rm -rf $(BUILD_DIR)

tidy:
	go mod tidy

lint:
	golangci-lint run
''',
            "Dockerfile": '''FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/main ./main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .
COPY .env.example .env

EXPOSE 8080

CMD ["./main"]
''',
        },
    },
    "rails": {
        "language": "ruby",
        # Rails 8: Interactive setup for database, CSS, and other options
        "commands": [
            # Interactive: asks about database, CSS framework, JavaScript bundler, etc.
            ["rails", "new", ".", "--skip-git"],
        ],
        "interactive_commands": [0],  # Index of commands that should be interactive
        "auth_commands": [
            ["bundle", "add", "jwt"],
            ["bundle", "add", "bcrypt"],
        ],
        "structure": {
            "app/services": [],
            "app/controllers/api/v1": [],
            "storage": [],  # Rails 8 SQLite storage directory
        },
        "files": {
            ".env.example": "SECRET_KEY_BASE=your-secret-key-change-in-production\nRAILS_ENV=development\n",
        },
        "config_files": True,  # Indicates Rails 8 config files should be copied
    },
}


def run_command(cmd: list, cwd: Path, interactive: bool = False) -> bool:
    """Execute a shell command."""
    try:
        print(f"  Running: {' '.join(cmd)}")
        if interactive:
            # Interactive mode: allow user input (for rails new, etc.)
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
    """Create directory structure with files."""
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
        full_path.write_text(content)


def setup_auth_files(framework: str, project_path: Path):
    """Copy authentication template files to project."""
    auth_file_mappings = {
        "fastapi": (FASTAPI_AUTH_FILES, "fastapi"),
        "express": (EXPRESS_AUTH_FILES, "express"),
        "rails": (RAILS_AUTH_FILES, "rails"),
    }

    if framework not in auth_file_mappings:
        print(f"  Auth templates not available for {framework}")
        return False

    file_map, template_dir_name = auth_file_mappings[framework]
    auth_templates_dir = TEMPLATES_DIR / template_dir_name / "auth"

    if not auth_templates_dir.exists():
        print(f"  Warning: Auth templates not found at {auth_templates_dir}")
        return False

    print("Setting up authentication files...")
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


def setup_rails_config_files(project_path: Path):
    """Copy Rails 8 configuration files (SQLite WAL, Tailwind v4)."""
    rails_templates_dir = TEMPLATES_DIR / "rails"

    if not rails_templates_dir.exists():
        print(f"  Warning: Rails templates not found at {rails_templates_dir}")
        return False

    print("Setting up Rails 8 configuration files...")
    for template_name, target_path in RAILS_CONFIG_FILES.items():
        src = rails_templates_dir / template_name
        dst = project_path / target_path
        if src.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            print(f"  Created: {target_path}")
        else:
            print(f"  Warning: Config template not found: {template_name}")

    return True


def setup_backend(framework: str, project_path: Path, skip_install: bool = False, with_auth: bool = False):
    """Set up backend project."""
    if framework not in FRAMEWORKS:
        print(f"Unknown framework: {framework}")
        print(f"Available: {', '.join(FRAMEWORKS.keys())}")
        sys.exit(1)

    config = FRAMEWORKS[framework]
    print(f"\n{'='*50}")
    print(f"Setting up {framework} backend project")
    print(f"Path: {project_path}")
    print(f"{'='*50}\n")

    # Create project directory
    project_path.mkdir(parents=True, exist_ok=True)

    # Check for special notes
    if "note" in config:
        print(f"Note: {config['note']}\n")

    # Create structure
    if config["structure"]:
        print("Creating directory structure...")
        create_structure(project_path, config["structure"])

    # Create files
    if config["files"]:
        print("Creating files...")
        create_files(project_path, config["files"])

    # Run commands
    if not skip_install and config["commands"]:
        print("Running setup commands...")
        interactive_indices = config.get("interactive_commands", [])
        for i, cmd in enumerate(config["commands"]):
            is_interactive = i in interactive_indices
            if not run_command(cmd, project_path, interactive=is_interactive):
                print(f"Warning: Command failed, continuing...")

        # Run DB commands
        if "db_commands" in config:
            print("Installing database dependencies...")
            for cmd in config["db_commands"]:
                if not run_command(cmd, project_path):
                    print(f"Warning: DB command failed, continuing...")

        # Run auth commands if requested
        if with_auth and "auth_commands" in config:
            print("Installing authentication dependencies...")
            for cmd in config["auth_commands"]:
                if not run_command(cmd, project_path):
                    print(f"Warning: Auth command failed, continuing...")

    # Setup Rails 8 config files if applicable
    if config.get("config_files"):
        setup_rails_config_files(project_path)

    # Setup auth files if requested
    if with_auth:
        setup_auth_files(framework, project_path)

    print(f"\n{'='*50}")
    print(f"Backend setup complete!")
    if framework == "rails":
        print("Rails 8 features included:")
        print("  - SQLite with WAL mode (production-ready)")
        print("  - Tailwind CSS v4 (CSS-first configuration)")
        print("  - Propshaft asset pipeline")
    if with_auth:
        print("Authentication templates included!")
        if framework == "rails":
            print("  - JWT + Session-based dual authentication")
    print(f"{'='*50}\n")


def main():
    parser = argparse.ArgumentParser(description="Set up backend project")
    parser.add_argument(
        "--framework", "-f",
        choices=list(FRAMEWORKS.keys()),
        help="Backend framework to use"
    )
    parser.add_argument(
        "--path", "-p",
        default="./backend",
        help="Project path (default: ./backend)"
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
        help="Include authentication templates (signup, login, logout, profile)"
    )

    args = parser.parse_args()

    if args.list:
        print("Available frameworks:")
        for name, config in FRAMEWORKS.items():
            auth_support = "✓ auth" if "auth_commands" in config else ""
            print(f"  - {name} ({config['language']}) {auth_support}")
        return

    if not args.framework:
        parser.error("--framework/-f is required when not using --list")

    setup_backend(args.framework, Path(args.path), args.skip_install, args.with_auth)


if __name__ == "__main__":
    main()
