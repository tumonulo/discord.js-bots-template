type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error' | 'fatal'
type LogData = Record<string, unknown>
type LoggerFn = ((message: string, data?: LogData) => void) & {
  bold: (message: string, data?: LogData) => void
}

type BannerColor = Exclude<keyof typeof COLORS, 'reset' | 'bold'>

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[96m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  discord: '\x1b[38;2;138;155;255m',
  orange: '\x1b[38;5;208m',
  purple: '\x1b[38;5;93m',
  pink: '\x1b[38;5;213m',
  lime: '\x1b[38;5;118m',
  teal: '\x1b[38;5;37m',
  gold: '\x1b[38;5;220m',
  brown: '\x1b[38;5;130m',
  navy: '\x1b[38;5;17m',
  violet: '\x1b[38;5;135m',
  indigo: '\x1b[38;5;63m',
  turquoise: '\x1b[38;5;45m',
  coral: '\x1b[38;5;203m',
  salmon: '\x1b[38;5;209m',
  beige: '\x1b[38;5;230m',
  maroon: '\x1b[38;5;88m',
  olive: '\x1b[38;5;100m',
  mint: '\x1b[38;5;121m',
  lavender: '\x1b[38;5;183m',
  peach: '\x1b[38;5;216m',
  sky: '\x1b[38;5;117m',
  rose: '\x1b[38;5;204m'
} as const

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: COLORS.gray,
  info: COLORS.cyan,
  success: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.red,
  fatal: COLORS.brightRed
}

const TYPE_COLORS = {
  string: COLORS.white,
  number: COLORS.blue,
  boolean: COLORS.yellow,
  null: COLORS.magenta,
  key: COLORS.gray
} as const

const INDENT = 11

let lastLineBlank = false

function blank(): void {
  if (lastLineBlank) return
  console.log()
  lastLineBlank = true
}

function write(line: string): void {
  console.log(line)
  lastLineBlank = false
}

function time(): string {
  return new Date().toLocaleTimeString('es-ES', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function wrap(text: string, max: number): string[] {
  const lines: string[] = []

  for (const rawLine of text.split('\n')) {
    let line = ''

    for (const word of rawLine.split(' ')) {
      if (line && line.length + 1 + word.length <= max) {
        line += ` ${word}`
        continue
      }

      if (line) lines.push(line)

      if (word.length <= max) {
        line = word
        continue
      }

      let rest = word

      while (rest.length > max) {
        lines.push(rest.slice(0, max))
        rest = rest.slice(max)
      }

      line = rest
    }

    lines.push(line)
  }

  return lines
}

function printKeyValue(key: string, value: unknown, indent: number): void {
  const width = process.stdout.columns ?? 80
  const keyText = TYPE_COLORS.key + key + ':' + COLORS.reset + ' '
  const keyWidth = key.length + 2
  const max = Math.max(1, width - indent - keyWidth)

  if (typeof value === 'string') {
    const lines = wrap(value, max)

    write(' '.repeat(indent) + keyText + TYPE_COLORS.string + lines[0] + COLORS.reset)

    for (let i = 1; i < lines.length; i++) {
      write(' '.repeat(indent + keyWidth) + TYPE_COLORS.string + lines[i] + COLORS.reset)
    }

    return
  }

  if (typeof value === 'number') {
    write(' '.repeat(indent) + keyText + TYPE_COLORS.number + value + COLORS.reset)
    return
  }

  if (typeof value === 'boolean') {
    write(' '.repeat(indent) + keyText + TYPE_COLORS.boolean + value + COLORS.reset)
    return
  }

  if (value === null) {
    write(' '.repeat(indent) + keyText + TYPE_COLORS.null + 'null' + COLORS.reset)
    return
  }

  if (typeof value === 'object') {
    write(' '.repeat(indent) + keyText)
    for (const [k, v] of Object.entries(value as LogData)) {
      printKeyValue(k, v, indent + INDENT)
    }
    return
  }

  const text = String(value)
  const lines = wrap(text, max)

  write(' '.repeat(indent) + keyText + TYPE_COLORS.string + lines[0] + COLORS.reset)

  for (let i = 1; i < lines.length; i++) {
    write(' '.repeat(indent + keyWidth) + TYPE_COLORS.string + lines[i] + COLORS.reset)
  }
}

function printData(data: LogData): void {
  for (const [key, value] of Object.entries(data)) {
    printKeyValue(key, value, INDENT)
  }
}

export function logBanner(title: string, color: BannerColor): void {
  const accent = COLORS[color]
  const width = Math.max(title.length + 6, 44)
  const line = '═'.repeat(width)
  const padded = title.padStart(Math.floor((width + title.length) / 2)).padEnd(width)

  blank()
  console.log(
    [
      accent + '╔' + line + '╗' + COLORS.reset,
      accent +
        '║' +
        COLORS.reset +
        COLORS.bold +
        accent +
        padded +
        COLORS.reset +
        accent +
        '║' +
        COLORS.reset,
      accent + '╚' + line + '╝' + COLORS.reset
    ].join('\n')
  )
  lastLineBlank = false
  blank()
}

function createLogger(level: LogLevel): LoggerFn {
  const color = LEVEL_COLORS[level]

  const base = (message: string, data?: LogData, bold = false): void => {
    if (!message) return

    const spaced = level === 'error' || level === 'fatal'
    if (spaced) blank()

    const now = time()
    const prefix = COLORS.gray + '[' + now + ']' + COLORS.reset + ' '
    const indent = ' '.repeat(now.length + 3)
    const width = process.stdout.columns ?? 80
    const max = Math.max(20, width - (now.length + 3))
    const style = color + (bold ? COLORS.bold : '')

    let first = true

    wrap(message, max).forEach((line) => {
      if (!line) {
        blank()
        return
      }

      write((first ? prefix : indent) + style + line + COLORS.reset)
      first = false
    })

    if (data && Object.keys(data).length) {
      printData(data)
    }

    if (spaced) blank()
  }

  const fn = ((message: string, data?: LogData) => base(message, data, false)) as LoggerFn
  fn.bold = (message: string, data?: LogData) => base(message, data, true)

  return fn
}

const logger: Record<LogLevel, LoggerFn> = {
  debug: createLogger('debug'),
  info: createLogger('info'),
  success: createLogger('success'),
  warn: createLogger('warn'),
  error: createLogger('error'),
  fatal: createLogger('fatal')
}

export default logger
