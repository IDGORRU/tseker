export interface LogEntry {
  timestamp: string
  message: string
  color: string
}

export interface Stats {
  good: number
  bad: number
  skipped: number
  total: number
}

export interface EmailCheckResult {
  isValid: boolean
  errorMessage: string
  messageCount: number
  provider: string
}

export interface AttachmentResult {
  downloadedCount: number
}

export type Provider = "Auto-Detect" | "Gmail" | "Yahoo" | "Outlook" | "Mail.ru" | "Yandex" | "Rambler"

export type ProxyType = "HTTP" | "SOCKS4" | "SOCKS5"

export interface KeywordRule {
  id: string
  keyword: string
  matchType: "exact" | "contains" | "regex"
  priority: "high" | "medium" | "low"
  action: "flag" | "skip" | "priority"
  enabled: boolean
  caseSensitive: boolean
}

export interface MessageParserConfig {
  enabled: boolean
  rules: KeywordRule[]
  defaultAction: "accept" | "reject"
  logMatches: boolean
}

export interface ProxyConfig {
  id: string
  host: string
  port: number
  type: ProxyType
  username?: string
  password?: string
  status: "untested" | "working" | "failed"
  responseTime?: number
  lastTested?: string
  enabled: boolean
}

export interface ProxyParserConfig {
  autoDetectFormat: boolean
  validateOnAdd: boolean
  testTimeout: number
  rotationEnabled: boolean
  rotationInterval: number
  maxRetries: number
}
