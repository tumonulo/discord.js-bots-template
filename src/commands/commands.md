# Commands

Path: `src/commands/<type>/<permission>/<name>.ts`

---

## Type

| Type          | Use                           |
| ------------- | ----------------------------- |
| `prefix`      | `!name`                       |
| `slash`       | `/name`                       |
| `contextMenu` | Right-click a user or message |

## Permission

| Folder    | Access                                      |
| --------- | ------------------------------------------- |
| `dev/`    | User IDs in `DEV_IDS`                       |
| `admin/`  | Administrator                               |
| `staff/`  | Administrator or a role saved with `/staff` |
| `member/` | Everyone                                    |

Dev is not admin/staff. Dev slash/context register only in `GUILD_ID`.

## Name

- File name is the command name.
- Slash/prefix: exact match.
- Context menu: normalized, `Example Command` -> `exampleCommand`.

---

## Properties

- `data`: required for slash/context; command builder.
- `execute`: prefix `(message, args, client)`; slash/context `(interaction, client)`.
- `cooldown`: `number` or `{ seconds, scope }`; scope `user` (default), `guild`, or `global`.
- `aliases`: prefix only.
- `category`: optional; extend `CommandCategory` first.

---

## Snippets

Optional VS Code snippets in `.vscode/`.

| Snippet              | Creates                         |
| -------------------- | ------------------------------- |
| `prefixCommand`      | Basic prefix command            |
| `prefixSubCommand`   | Prefix command with subcommands |
| `slashCommand`       | Basic slash command             |
| `slashSubCommand`    | Slash command with subcommands  |
| `contextMenuCommand` | User or message context menu    |

Create the file, type the snippet name, press `Tab`, and fill the placeholders.
