<p align="center">
  <img src="https://cdn.simpleicons.org/discorddotjs/5865F2" width="88" alt="Discord.js" />
</p>

<h1 align="center">Discord.js Bots Template</h1>

<p align="center">
  A clean TypeScript starter for Discord.js 14 bots with typed commands, events and interactions, folder-based permissions, MongoDB guild config, automatic command deployment, Zod validation and graceful shutdown.
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://discord.js.org/">
    <img src="https://img.shields.io/badge/discord.js-14-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js 14" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 20+" />
  </a>
  <a href="https://www.mongodb.com/">
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#project-structure">Project structure</a> ·
  <a href="#commands">Commands</a> ·
  <a href="#events">Events</a> ·
  <a href="#interactions">Interactions</a> ·
  <a href="#scripts">Scripts</a>
</p>

---

## Features

- **Typed handlers**: strict contracts and startup validation for commands, events and interactions.
- **Permission folders**: `dev`, `admin`, `staff` and `member` access by location.
- **Automatic deployment**: updates only changed commands and clears the other scope when switching modes.
- **MongoDB config**: cached guild settings and `/staff` role management.
- **Fail-fast config**: Zod validates the token, IDs and MongoDB URL at startup.
- **Lifecycle**: recurring intervals with isolated failures and graceful shutdown of Discord, intervals and MongoDB.
- **Developer tooling**: ESLint, Prettier, VS Code snippets and a structured logger.

## Quick start

### Requirements

- Node.js 20+
- pnpm
- A Discord bot application and token
- A MongoDB database (Atlas or local)

### 1. Install

```bash
git clone https://github.com/tumonulo/discord.js-bots-template.git
cd discord.js-bots-template
pnpm install
```

### 2. Configure

```bash
cp .env.example .env
```

Fill in the variables described in [Configuration](#configuration). Enable **Message Content Intent** in the Discord Developer Portal if you want prefix commands.

### 3. Run

```bash
pnpm run dev
```

The bot starts in watch mode. On startup it loads commands, events and interactions, syncs changed commands with Discord, then connects to MongoDB.

## Configuration

| Variable        | Required    | Default | Description                                                         |
| --------------- | ----------- | ------- | ------------------------------------------------------------------- |
| `TOKEN`         | Yes         | -       | Discord bot token.                                                  |
| `PREFIX`        | Yes         | `!`     | Prefix used by message commands.                                    |
| `DEV_IDS`       | No          | empty   | Comma-separated dev user IDs. Empty disables dev commands.          |
| `MONGO_URL`     | Yes         | -       | MongoDB connection string.                                          |
| `DEPLOY_GLOBAL` | No          | `false` | `false`: guild-only commands. `true`: global non-dev commands.      |
| `GUILD_ID`      | Conditional | -       | Required when `DEPLOY_GLOBAL=false`; dev-command guild when `true`. |

- A dev is not automatically an admin or staff member.
- With `DEPLOY_GLOBAL=true`, dev commands go to `GUILD_ID`. If it is missing, they are skipped with a warning.
- Deployment runs on startup, updates only changed commands, and clears the other scope when switching modes.

### Startup banner

The title and color are set in `src/index.ts`:

```ts
logBanner('Discord.js Bots Template', 'discord')
```

The first argument is the title and the second is the color. Available colors live in `COLORS` in `src/utils/logger.ts`; add a custom truecolor entry there if you need another tone.

## Project structure

```text
src/
├── commands/        # Command routes by type and permission
├── events/          # Discord client events
├── interactions/    # Buttons, modals and select menus
├── handlers/        # Loaders and validation
├── models/          # Mongoose models
├── services/        # Guild config, permissions, cooldowns and deployment
├── config/          # Environment validation
├── types/           # Shared contracts
└── utils/           # Logger, interval and lifecycle helpers
```

## Commands

Commands live in `src/commands/<type>/<permission>/<name>.ts`; the file name is the command name.

| Type          | Usage                         |
| ------------- | ----------------------------- |
| `prefix`      | `!name`                       |
| `slash`       | `/name`                       |
| `contextMenu` | Right-click a user or message |

| Permission | Access                                      |
| ---------- | ------------------------------------------- |
| `dev/`     | User IDs in `DEV_IDS`                       |
| `admin/`   | Administrator                               |
| `staff/`   | Administrator or a role saved with `/staff` |
| `member/`  | Everyone                                    |

Full reference: [`src/commands/commands.md`](src/commands/commands.md).

## Events

Events live in `src/events/<ClientEvent>/`, where the folder matches a `ClientEvents` key. The client is passed as the last argument. Recurring tasks live in `src/events/clientReady/intervals.ts` and run independently.

Full reference: [`src/events/events.md`](src/events/events.md).

## Interactions

Handlers live in `src/interactions/<buttons|modals|selectMenus>/`. The file name is the base `customId`; `ticket.ts` handles `ticket`, `ticket:123` and `ticket:123:staff`. Handlers receive `(interaction, params, client)`, where `params` is a positional array parsed from the `customId`, and accept the same optional `cooldown` as commands.

Full reference: [`src/interactions/interactions.md`](src/interactions/interactions.md).

## Scripts

| Command                 | Description                 |
| ----------------------- | --------------------------- |
| `pnpm run dev`          | Run in watch mode           |
| `pnpm run build`        | Build the bot to `dist/`    |
| `pnpm run start`        | Start the compiled bot      |
| `pnpm run typecheck`    | Run the TypeScript compiler |
| `pnpm run lint`         | Run ESLint                  |
| `pnpm run format`       | Format code with Prettier   |
| `pnpm run format:check` | Check code formatting       |

For production:

```bash
pnpm run build
pnpm run start
```

## License

Released under the [MIT License](LICENSE).
