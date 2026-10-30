# Interactions

Path: `src/interactions/<type>/<base>.ts`

---

## Type

| Folder         | Handler                              |
| -------------- | ------------------------------------ |
| `buttons/`     | `ButtonHandler`                      |
| `modals/`      | `ModalHandler`                       |
| `selectMenus/` | `SelectMenuHandler` and its variants |

Only direct files; the same base can exist in different folders.

## Base

- File name is the base `customId`: `ticket.ts` handles `ticket`, `ticket:123`, and `ticket:123:staff`.
- No permission folders; check inside `execute` if needed.
- Do not add a `customId` property to the handler.

---

## Properties

- `execute`: `(interaction, params, client)`.
- `params`: `string[]` from the `customId`; `ticket:123:staff` -> `['123', 'staff']`.
- `cooldown`: same as commands; shared by all `ticket:...` ids.

---

## Snippets

Optional VS Code snippets in `.vscode/`.

| Snippet                    | Creates                         |
| -------------------------- | ------------------------------- |
| `buttonHandler`            | Button handler                  |
| `modalHandler`             | Modal handler                   |
| `stringSelectHandler`      | String select menu handler      |
| `userSelectHandler`        | User select menu handler        |
| `roleSelectHandler`        | Role select menu handler        |
| `mentionableSelectHandler` | Mentionable select menu handler |
| `channelSelectHandler`     | Channel select menu handler     |

Create the file, type the snippet name, press `Tab`, and fill the placeholders.
