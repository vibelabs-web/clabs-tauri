#!/usr/bin/env python3
"""
Docker Compose Setup Script
Creates Docker Compose configuration for database services.
"""

import argparse
from pathlib import Path


DOCKER_COMPOSE_TEMPLATES = {
    "postgres": {
        "filename": "docker-compose.yml",
        "content": '''services:
  db:
    image: postgres:16-alpine
    container_name: postgres_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-app}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
''',
        "env": '''# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=app
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
''',
    },
    "postgres-pgvector": {
        "filename": "docker-compose.yml",
        "content": '''services:
  db:
    image: pgvector/pgvector:pg16
    container_name: postgres_pgvector_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-app}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-pgvector.sql:/docker-entrypoint-initdb.d/init-pgvector.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
''',
        "env": '''# PostgreSQL with PGVector
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=app
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app
''',
        "init_sql": '''-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
''',
    },
    "postgres-redis": {
        "filename": "docker-compose.yml",
        "content": '''services:
  db:
    image: postgres:16-alpine
    container_name: postgres_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-app}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: redis_cache
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
''',
        "env": '''# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=app
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app

# Redis
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
''',
    },
    "mysql": {
        "filename": "docker-compose.yml",
        "content": '''services:
  db:
    image: mysql:8
    container_name: mysql_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-app}
      MYSQL_USER: ${MYSQL_USER:-app}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-app}
    ports:
      - "${MYSQL_PORT:-3306}:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
''',
        "env": '''# MySQL
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=app
MYSQL_USER=app
MYSQL_PASSWORD=app
MYSQL_PORT=3306
DATABASE_URL=mysql://app:app@localhost:3306/app
''',
    },
    "mongodb": {
        "filename": "docker-compose.yml",
        "content": '''services:
  db:
    image: mongo:7
    container_name: mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:-root}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-root}
      MONGO_INITDB_DATABASE: ${MONGO_DB:-app}
    ports:
      - "${MONGO_PORT:-27017}:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
''',
        "env": '''# MongoDB
MONGO_USER=root
MONGO_PASSWORD=root
MONGO_DB=app
MONGO_PORT=27017
DATABASE_URL=mongodb://root:root@localhost:27017/app?authSource=admin
''',
    },
}


def setup_docker(template: str, project_path: Path):
    """Set up Docker Compose configuration."""
    if template not in DOCKER_COMPOSE_TEMPLATES:
        print(f"Unknown template: {template}")
        print(f"Available: {', '.join(DOCKER_COMPOSE_TEMPLATES.keys())}")
        return False

    config = DOCKER_COMPOSE_TEMPLATES[template]
    print(f"\n{'='*50}")
    print(f"Setting up Docker Compose: {template}")
    print(f"Path: {project_path}")
    print(f"{'='*50}\n")

    project_path.mkdir(parents=True, exist_ok=True)

    # Create docker-compose.yml
    compose_path = project_path / config["filename"]
    compose_path.write_text(config["content"])
    print(f"  Created: {config['filename']}")

    # Create .env file
    env_path = project_path / ".env"
    if env_path.exists():
        existing = env_path.read_text()
        if "DATABASE_URL" not in existing:
            env_path.write_text(existing + "\n" + config["env"])
            print(f"  Updated: .env")
    else:
        env_path.write_text(config["env"])
        print(f"  Created: .env")

    # Create .env.example
    env_example_path = project_path / ".env.example"
    env_example_path.write_text(config["env"])
    print(f"  Created: .env.example")

    # Create init SQL if exists (for pgvector)
    if "init_sql" in config:
        scripts_path = project_path / "scripts"
        scripts_path.mkdir(exist_ok=True)
        init_sql_path = scripts_path / "init-pgvector.sql"
        init_sql_path.write_text(config["init_sql"])
        print(f"  Created: scripts/init-pgvector.sql")

    print(f"\n{'='*50}")
    print("Docker Compose setup complete!")
    print(f"\nStart: docker compose up -d")
    print(f"Stop:  docker compose down")
    print(f"{'='*50}\n")

    return True


def main():
    parser = argparse.ArgumentParser(description="Set up Docker Compose")
    parser.add_argument(
        "--template", "-t",
        required=True,
        choices=list(DOCKER_COMPOSE_TEMPLATES.keys()),
        help="Docker Compose template"
    )
    parser.add_argument(
        "--path", "-p",
        default=".",
        help="Project path (default: .)"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available templates"
    )

    args = parser.parse_args()

    if args.list:
        print("Available templates:")
        for name in DOCKER_COMPOSE_TEMPLATES.keys():
            print(f"  - {name}")
        return

    setup_docker(args.template, Path(args.path))


if __name__ == "__main__":
    main()
