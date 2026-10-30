# Events

Path: `src/events/<event>/<file>.ts`

---

## Event

Folder must match a `ClientEvents` key: `clientReady`, `messageCreate`, `interactionCreate`, etc.

## File

- Any `.ts` or `.js` file; the name is free-form.
- Only files directly inside the event folder are loaded.
- Export with `satisfies Event<'eventName'>`.

---

## Properties

- `execute`: `(...eventArgs, client)`.
- `once`: optional boolean for a one-time listener.

---

## Snippets

Optional VS Code snippets in `.vscode/`.

| Snippet | Creates    |
| ------- | ---------- |
| `event` | Event file |

Create the file, type the snippet name, press `Tab`, and fill the placeholders.
