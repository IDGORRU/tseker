"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import Icon from "./Icon"
import type { ProxyType, ProxyConfig, ProxyParserConfig } from "../types"
import CollapsiblePanel from "./CollapsiblePanel"

interface ProxyManagerProps {
  proxyCount: number
  onAdd: (proxies: string[]) => void
  onImport: (content: string, fileName: string) => void
  onClear: () => void
}

const PROXY_TYPES: ProxyType[] = ["HTTP", "SOCKS4", "SOCKS5"]

const ProxyManager: React.FC<ProxyManagerProps> = ({ proxyCount, onAdd, onImport, onClear }) => {
  const [input, setInput] = useState("")
  const [proxyType, setProxyType] = useState<ProxyType>("HTTP")
  const [proxies, setProxies] = useState<ProxyConfig[]>([])
  const [isTestingProxies, setIsTestingProxies] = useState(false)
  const [parserConfig, setParserConfig] = useState<ProxyParserConfig>({
    autoDetectFormat: true,
    validateOnAdd: false,
    testTimeout: 10,
    rotationEnabled: true,
    rotationInterval: 30,
    maxRetries: 3,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseProxyString = (proxyStr: string): ProxyConfig | null => {
    const trimmed = proxyStr.trim()
    if (!trimmed) return null

    // Support multiple formats:
    // IP:Port
    // IP:Port:User:Pass
    // Type://IP:Port
    // Type://User:Pass@IP:Port
    // http://user:pass@ip:port

    let host = ""
    let port = 0
    let username = ""
    let password = ""
    let detectedType: ProxyType = proxyType

    try {
      // Try URL format first
      if (trimmed.includes("://")) {
        const url = new URL(trimmed)
        host = url.hostname
        port = Number.parseInt(url.port) || (url.protocol === "https:" ? 443 : 80)
        username = url.username
        password = url.password

        if (url.protocol.startsWith("socks4")) detectedType = "SOCKS4"
        else if (url.protocol.startsWith("socks5")) detectedType = "SOCKS5"
        else detectedType = "HTTP"
      } else {
        // Parse IP:Port:User:Pass format
        const parts = trimmed.split(":")
        if (parts.length < 2) return null

        host = parts[0]
        port = Number.parseInt(parts[1])
        if (parts.length >= 4) {
          username = parts[2]
          password = parts[3]
        }
      }

      if (!host || !port || port < 1 || port > 65535) return null

      return {
        id: Date.now().toString() + Math.random(),
        host,
        port,
        type: parserConfig.autoDetectFormat ? detectedType : proxyType,
        username: username || undefined,
        password: password || undefined,
        status: "untested",
        enabled: true,
      }
    } catch {
      return null
    }
  }

  const testProxy = async (proxy: ProxyConfig): Promise<{ working: boolean; responseTime?: number }> => {
    // Simulate proxy testing
    return new Promise((resolve) => {
      setTimeout(
        () => {
          const working = Math.random() > 0.3 // 70% success rate
          const responseTime = working ? Math.floor(Math.random() * 2000) + 100 : undefined
          resolve({ working, responseTime })
        },
        Math.random() * 1000 + 500,
      )
    })
  }

  const handleAddClick = useCallback(async () => {
    const proxyStrings = input
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)

    if (proxyStrings.length === 0) return

    const newProxies: ProxyConfig[] = []
    const validProxyStrings: string[] = []

    for (const proxyStr of proxyStrings) {
      const parsed = parseProxyString(proxyStr)
      if (parsed) {
        newProxies.push(parsed)
        validProxyStrings.push(`${parsed.host}:${parsed.port}`)
      }
    }

    if (newProxies.length > 0) {
      setProxies((prev) => [...prev, ...newProxies])
      onAdd(validProxyStrings)

      if (parserConfig.validateOnAdd) {
        setIsTestingProxies(true)
        for (const proxy of newProxies) {
          const result = await testProxy(proxy)
          setProxies((prev) =>
            prev.map((p) =>
              p.id === proxy.id
                ? {
                    ...p,
                    status: result.working ? "working" : "failed",
                    responseTime: result.responseTime,
                    lastTested: new Date().toISOString(),
                  }
                : p,
            ),
          )
        }
        setIsTestingProxies(false)
      }
    }

    setInput("")
  }, [input, proxyType, parserConfig, onAdd])

  const testAllProxies = async () => {
    setIsTestingProxies(true)

    for (const proxy of proxies) {
      if (!proxy.enabled) continue

      const result = await testProxy(proxy)
      setProxies((prev) =>
        prev.map((p) =>
          p.id === proxy.id
            ? {
                ...p,
                status: result.working ? "working" : "failed",
                responseTime: result.responseTime,
                lastTested: new Date().toISOString(),
              }
            : p,
        ),
      )
    }

    setIsTestingProxies(false)
  }

  const removeProxy = (id: string) => {
    setProxies((prev) => prev.filter((p) => p.id !== id))
  }

  const toggleProxy = (id: string) => {
    setProxies((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "working":
        return "text-green-400"
      case "failed":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "working":
        return "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      case "failed":
        return "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      default:
        return "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onImport(content, file.name)
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const titleContent = (
    <div className="flex justify-between items-center w-full">
      <span>🌐 Прокси ({proxyCount})</span>
      <div className="flex items-center gap-2">
        {proxies.filter((p) => p.status === "working").length > 0 && (
          <span className="text-xs text-green-400">
            {proxies.filter((p) => p.status === "working").length} работают
          </span>
        )}
        <select
          value={proxyType}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setProxyType(e.target.value as ProxyType)}
          className="bg-gray-900 border border-gray-600 rounded-md p-1 text-xs focus:ring-cyan-500 focus:border-cyan-500"
          aria-label="Proxy Type"
        >
          {PROXY_TYPES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  return (
    <CollapsiblePanel title={titleContent}>
      <div className="flex flex-col gap-4">
        {/* Input Area */}
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Поддерживаемые форматы:
IP:Port
IP:Port:User:Pass
http://user:pass@ip:port
socks5://ip:port`}
            className="w-full h-24 bg-gray-900 border border-gray-600 rounded-md p-2 text-sm font-mono focus:ring-cyan-500 focus:border-cyan-500"
          />

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddClick}
              disabled={isTestingProxies}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Icon path="M12 4.5v15m7.5-7.5h-15" className="w-4 h-4" />
              Добавить
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Icon
                path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                className="w-4 h-4"
              />
              Импорт
            </button>

            {proxies.length > 0 && (
              <button
                onClick={testAllProxies}
                disabled={isTestingProxies}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Icon
                  path="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  className={`w-4 h-4 ${isTestingProxies ? "animate-spin" : ""}`}
                />
                {isTestingProxies ? "Тестирую..." : "Тест"}
              </button>
            )}

            <button
              onClick={onClear}
              className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded-md transition-colors"
              aria-label="Clear Proxies"
            >
              <Icon
                path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700 hover:bg-gray-750 transition-colors"
        >
          <span className="text-sm font-medium text-gray-300">Расширенные настройки</span>
          <Icon
            path={showAdvanced ? "M4.5 15.75l7.5-7.5 7.5 7.5" : "M19.5 8.25l-7.5 7.5-7.5-7.5"}
            className="w-4 h-4 text-gray-400"
          />
        </button>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-white mb-3">Настройки Парсера</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parserConfig.autoDetectFormat}
                  onChange={(e) => setParserConfig((prev) => ({ ...prev, autoDetectFormat: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Автоопределение формата</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parserConfig.validateOnAdd}
                  onChange={(e) => setParserConfig((prev) => ({ ...prev, validateOnAdd: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Проверять при добавлении</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parserConfig.rotationEnabled}
                  onChange={(e) => setParserConfig((prev) => ({ ...prev, rotationEnabled: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Ротация прокси</span>
              </label>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Таймаут тестирования (сек)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={parserConfig.testTimeout}
                  onChange={(e) =>
                    setParserConfig((prev) => ({ ...prev, testTimeout: Number.parseInt(e.target.value) || 10 }))
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Proxy List */}
        {proxies.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">Список Прокси ({proxies.length})</h4>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {proxies.filter((p) => p.status === "working").length} работают
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  {proxies.filter((p) => p.status === "failed").length} не работают
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {proxies.map((proxy) => (
                <div key={proxy.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-600">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proxy.enabled}
                      onChange={() => toggleProxy(proxy.id)}
                      className="mr-2"
                    />
                  </label>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-white truncate">
                        {proxy.host}:{proxy.port}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">{proxy.type}</span>
                      {proxy.username && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-800 text-blue-300">AUTH</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={getStatusColor(proxy.status)}>
                        {proxy.status === "working"
                          ? "Работает"
                          : proxy.status === "failed"
                            ? "Не работает"
                            : "Не проверен"}
                      </span>
                      {proxy.responseTime && (
                        <>
                          <span>•</span>
                          <span>{proxy.responseTime}ms</span>
                        </>
                      )}
                      {proxy.lastTested && (
                        <>
                          <span>•</span>
                          <span>Проверен: {new Date(proxy.lastTested).toLocaleTimeString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Icon path={getStatusIcon(proxy.status)} className={`w-4 h-4 ${getStatusColor(proxy.status)}`} />

                    <button
                      onClick={() => removeProxy(proxy.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="Удалить прокси"
                    >
                      <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt" className="hidden" />
      </div>
    </CollapsiblePanel>
  )
}

export default ProxyManager
