# Framework Application Template (`mohamedhabibwork/framework-app`)

Starter application template for [**mohamedhabibwork/framework**](https://github.com/mohamedhabibwork/framework) — a Laravel-inspired TypeScript backend framework powered by **Bun**, **Hono**, **Drizzle ORM**, and **Zod**.

## Ecosystem Links

- **Main Framework Repository**: [mohamedhabibwork/framework](https://github.com/mohamedhabibwork/framework)
- **Starter App Template**: [mohamedhabibwork/framework-app](https://github.com/mohamedhabibwork/framework-app)
- **Documentation Repository**: [mohamedhabibwork/framework-docs](https://github.com/mohamedhabibwork/framework-docs)
- **Live Documentation**: [https://framework.habib.cloud](https://framework.habib.cloud)

## Create a New Application

### Option 1: GitHub CLI / "Use this template"

```sh
gh repo create my-api --template mohamedhabibwork/framework-app --clone --private
cd my-api
cp .env.example .env
bun install
```

### Option 2: Framework CLI

From inside the [`mohamedhabibwork/framework`](https://github.com/mohamedhabibwork/framework) workspace:

```sh
bun run cli -- create ../my-api
```

## Quickstart

```sh
# 1. Start PostgreSQL & Redis
docker compose -f deployment/compose.yaml up -d --wait

# 2. Generate and apply initial database migrations
bun run cli -- db:generate --name create-audit-logs
bun run cli -- db:migrate

# 3. Scaffold a full CRUD resource module (schema, DTOs, service, controller, policy, routes, OpenAPI, tests)
bun run cli -- make:crud Product \
  --module products \
  --fields 'name:text:required,price:numeric:required' \
  --access public \
  --verify

# 4. Run the development server
bun run dev          # http://127.0.0.1:3000/health/ready
bun run worker       # optional: background queue worker
```

## Included Framework Packages

All `@framework/*` packages are linked directly to their dedicated GitHub repositories:

- [`@framework/core`](https://github.com/mohamedhabibwork/framework-core)
- [`@framework/http`](https://github.com/mohamedhabibwork/framework-http)
- [`@framework/database`](https://github.com/mohamedhabibwork/framework-database)
- [`@framework/crud`](https://github.com/mohamedhabibwork/framework-crud)
- [`@framework/validation`](https://github.com/mohamedhabibwork/framework-validation)
- [`@framework/events`](https://github.com/mohamedhabibwork/framework-events)
- [`@framework/queue`](https://github.com/mohamedhabibwork/framework-queue)
- [`@framework/cache`](https://github.com/mohamedhabibwork/framework-cache)
- [`@framework/logging`](https://github.com/mohamedhabibwork/framework-logging)
- [`@framework/storage`](https://github.com/mohamedhabibwork/framework-storage)
- [`@framework/openapi`](https://github.com/mohamedhabibwork/framework-openapi)
- [`@framework/support`](https://github.com/mohamedhabibwork/framework-support)
- [`@framework/cli`](https://github.com/mohamedhabibwork/framework-cli)
- [`@framework/testing`](https://github.com/mohamedhabibwork/framework-testing)
