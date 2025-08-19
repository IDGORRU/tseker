import type {
  Provider,
  ProxyType,
  EmailProtocolConfig,
  KeywordRule,
  MessageParserConfig,
  ProxyParserConfig,
} from "./types"

export const PROVIDERS: Provider[] = ["Auto-Detect", "Gmail", "Yahoo", "Outlook", "Mail.ru", "Yandex", "Rambler"]

export const OPEN_ROUTER_MODELS: { id: string; name: string; description: string }[] = [
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini Flash 1.5",
    description: "Быстрая модель Google, хорошо подходит для проверки email",
  },
  {
    id: "mistralai/mistral-7b-instruct",
    name: "Mistral 7B",
    description: "Эффективная модель для текстовых задач",
  },
  {
    id: "meta-llama/llama-3-8b-instruct",
    name: "Llama 3 8B",
    description: "Мощная модель Meta для инструкций",
  },
  {
    id: "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
    name: "Nous Hermes 2",
    description: "Продвинутая модель для сложных задач",
  },
  {
    id: "huggingfaceh4/zephyr-7b-beta",
    name: "Zephyr 7B Beta",
    description: "Экспериментальная модель HuggingFace",
  },
  {
    id: "openchat/openchat-7b",
    name: "OpenChat 7B",
    description: "Открытая модель для диалогов",
  },
  {
    id: "microsoft/wizardlm-2-8x22b",
    name: "WizardLM 2",
    description: "Модель Microsoft для сложных инструкций",
  },
  {
    id: "qwen/qwen-2-7b-instruct",
    name: "Qwen 2 7B",
    description: "Китайская модель с хорошей производительностью",
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    description: "Быстрая модель Anthropic",
  },
  {
    id: "cohere/command-r",
    name: "Command R",
    description: "Модель Cohere для команд и инструкций",
  },
]

export const DEFAULT_EMAIL_PROTOCOLS: EmailProtocolConfig[] = [
  { protocol: "IMAP", host: "imap.gmail.com", port: 993, encryption: "SSL", timeout: 10, enabled: true },
  { protocol: "POP3", host: "pop.gmail.com", port: 995, encryption: "SSL", timeout: 10, enabled: false },
  { protocol: "SMTP", host: "smtp.gmail.com", port: 587, encryption: "TLS", timeout: 10, enabled: false },
]

export const EMAIL_PROVIDER_CONFIGS = {
  Gmail: {
    IMAP: { host: "imap.gmail.com", port: 993, encryption: "SSL" as const },
    POP3: { host: "pop.gmail.com", port: 995, encryption: "SSL" as const },
    SMTP: { host: "smtp.gmail.com", port: 587, encryption: "TLS" as const },
  },
  Yahoo: {
    IMAP: { host: "imap.mail.yahoo.com", port: 993, encryption: "SSL" as const },
    POP3: { host: "pop.mail.yahoo.com", port: 995, encryption: "SSL" as const },
    SMTP: { host: "smtp.mail.yahoo.com", port: 587, encryption: "TLS" as const },
  },
  Outlook: {
    IMAP: { host: "outlook.office365.com", port: 993, encryption: "SSL" as const },
    POP3: { host: "outlook.office365.com", port: 995, encryption: "SSL" as const },
    SMTP: { host: "smtp.office365.com", port: 587, encryption: "TLS" as const },
  },
  "Mail.ru": {
    IMAP: { host: "imap.mail.ru", port: 993, encryption: "SSL" as const },
    POP3: { host: "pop.mail.ru", port: 995, encryption: "SSL" as const },
    SMTP: { host: "smtp.mail.ru", port: 587, encryption: "TLS" as const },
  },
  Yandex: {
    IMAP: { host: "imap.yandex.ru", port: 993, encryption: "SSL" as const },
    POP3: { host: "pop.yandex.ru", port: 995, encryption: "SSL" as const },
    SMTP: { host: "smtp.yandex.ru", port: 587, encryption: "TLS" as const },
  },
  Rambler: {
    IMAP: { host: "imap.rambler.ru", port: 993, encryption: "SSL" as const },
    POP3: { host: "pop.rambler.ru", port: 995, encryption: "SSL" as const },
    SMTP: { host: "smtp.rambler.ru", port: 587, encryption: "TLS" as const },
  },
}

export const PROXY_TYPES: ProxyType[] = ["HTTP", "SOCKS4", "SOCKS5"]

export const DEFAULT_PROXY_PARSER_CONFIG: ProxyParserConfig = {
  autoDetectFormat: true,
  validateOnAdd: false,
  testTimeout: 10,
  rotationEnabled: true,
  rotationInterval: 30,
  maxRetries: 3,
}

export const DEFAULT_MESSAGE_PARSER_CONFIG: MessageParserConfig = {
  enabled: false,
  rules: [],
  defaultAction: "accept",
  logMatches: true,
}

export const PREDEFINED_KEYWORD_RULES: KeywordRule[] = [
  {
    id: "spam-1",
    keyword: "spam",
    matchType: "contains",
    priority: "high",
    action: "skip",
    enabled: true,
    caseSensitive: false,
  },
  {
    id: "promotion-1",
    keyword: "promotion",
    matchType: "contains",
    priority: "medium",
    action: "flag",
    enabled: false,
    caseSensitive: false,
  },
  {
    id: "urgent-1",
    keyword: "urgent",
    matchType: "contains",
    priority: "high",
    action: "priority",
    enabled: false,
    caseSensitive: false,
  },
  {
    id: "invoice-1",
    keyword: "invoice",
    matchType: "contains",
    priority: "medium",
    action: "flag",
    enabled: false,
    caseSensitive: false,
  },
  {
    id: "security-1",
    keyword: "security alert",
    matchType: "contains",
    priority: "high",
    action: "priority",
    enabled: false,
    caseSensitive: false,
  },
]

export const ENCRYPTION_TYPES = ["SSL", "TLS", "None"] as const

export const MATCH_TYPES = ["exact", "contains", "regex"] as const

export const PRIORITY_LEVELS = ["high", "medium", "low"] as const

export const ACTION_TYPES = ["flag", "skip", "priority"] as const

export const DEFAULT_ACTIONS = ["accept", "reject"] as const

export const DEFAULT_PROXY_PORTS = {
  HTTP: 8080,
  SOCKS4: 1080,
  SOCKS5: 1080,
} as const

export const TIMEOUT_LIMITS = {
  MIN_TIMEOUT: 5,
  MAX_TIMEOUT: 60,
  DEFAULT_TIMEOUT: 10,
} as const

export const THREAD_LIMITS = {
  MIN_THREADS: 1,
  MAX_THREADS: 20,
  DEFAULT_THREADS: 5,
} as const

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  DOMAIN: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  PORT: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
} as const

export const STATUS_COLORS = {
  SUCCESS: "text-green-400",
  ERROR: "text-red-400",
  WARNING: "text-yellow-400",
  INFO: "text-cyan-400",
  NEUTRAL: "text-gray-400",
} as const

export const LOG_COLORS = {
  SUCCESS: "text-green-400",
  ERROR: "text-red-500",
  WARNING: "text-yellow-400",
  INFO: "text-cyan-400",
  DEBUG: "text-gray-300",
  NEUTRAL: "text-gray-500",
} as const
