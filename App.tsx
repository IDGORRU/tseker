"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { simulateCheckAccount, simulateDownloadAttachments } from "./services/apiService"
import type { LogEntry, Stats, Provider, MessageParserConfig, ProxyConfig, ProxyParserConfig } from "./types"
import {
  PROVIDERS,
  OPEN_ROUTER_MODELS,
  DEFAULT_EMAIL_PROTOCOLS,
  DEFAULT_MESSAGE_PARSER_CONFIG,
  DEFAULT_PROXY_PARSER_CONFIG,
} from "./constants"
import Icon from "./components/Icon"
import Terminal from "./components/Terminal"
import StatCard from "./components/StatCard"
import AccountManager from "./components/AccountManager"
import ProxyManager from "./components/ProxyManager"
import CollapsiblePanel from "./components/CollapsiblePanel"
import EmailProtocolSettings, { type EmailProtocolConfig } from "./components/EmailProtocolSettings"
import MessageParser from "./components/MessageParser"

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<string[]>([])
  const [proxies, setProxies] = useState<string[]>([])
  const [proxyConfigs, setProxyConfigs] = useState<ProxyConfig[]>([])
  const [results, setResults] = useState<
    Array<{
      email: string
      status: "good" | "bad" | "skipped"
      details: string
      timestamp: string
      keywordMatches?: string[]
    }>
  >([])

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<Stats>({ good: 0, bad: 0, skipped: 0, total: 0 })
  const [progress, setProgress] = useState(0)

  const [isRunning, setIsRunning] = useState(false)
  const stopCheckingRef = useRef(false)

  const [selectedProvider, setSelectedProvider] = useState<Provider>(PROVIDERS[0])
  const [isSavingAttachments, setIsSavingAttachments] = useState(false)
  const [threads, setThreads] = useState(5)

  const [openRouterApiKey, setOpenRouterApiKey] = useState("")
  const [selectedModel, setSelectedModel] = useState<string>(OPEN_ROUTER_MODELS[0].id)

  const [emailProtocolConfigs, setEmailProtocolConfigs] = useState<EmailProtocolConfig[]>(DEFAULT_EMAIL_PROTOCOLS)
  const [messageParserConfig, setMessageParserConfig] = useState<MessageParserConfig>(DEFAULT_MESSAGE_PARSER_CONFIG)
  const [proxyParserConfig, setProxyParserConfig] = useState<ProxyParserConfig>(DEFAULT_PROXY_PARSER_CONFIG)

  const logMessage = useCallback((message: string, color: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false })
    setLogs((prevLogs) => [...prevLogs, { timestamp, message, color }])
  }, [])

  useEffect(() => {
    logMessage("Welcome to the Enhanced Email Account Checker!", "text-cyan-400")
    logMessage(
      "Configure your settings: API key, email protocols, message parser, and proxy settings.",
      "text-yellow-400",
    )

    const activeProtocols = emailProtocolConfigs
      .filter((p) => p.enabled)
      .map((p) => p.protocol)
      .join(", ")
    if (activeProtocols) {
      logMessage(`Active email protocols: ${activeProtocols}`, "text-blue-400")
    }

    if (messageParserConfig.enabled && messageParserConfig.rules.length > 0) {
      logMessage(
        `Message parser enabled with ${messageParserConfig.rules.filter((r) => r.enabled).length} active rules`,
        "text-blue-400",
      )
    }
  }, [logMessage, emailProtocolConfigs, messageParserConfig])

  const parseMessageContent = useCallback(
    (email: string, messageContent: string): { shouldSkip: boolean; matches: string[] } => {
      if (!messageParserConfig.enabled || messageParserConfig.rules.length === 0) {
        return { shouldSkip: false, matches: [] }
      }

      const matches: string[] = []
      let shouldSkip = false

      for (const rule of messageParserConfig.rules) {
        if (!rule.enabled) continue

        let isMatch = false
        const content = rule.caseSensitive ? messageContent : messageContent.toLowerCase()
        const keyword = rule.caseSensitive ? rule.keyword : rule.keyword.toLowerCase()

        switch (rule.matchType) {
          case "exact":
            isMatch = content === keyword
            break
          case "contains":
            isMatch = content.includes(keyword)
            break
          case "regex":
            try {
              const regex = new RegExp(keyword, rule.caseSensitive ? "g" : "gi")
              isMatch = regex.test(content)
            } catch {
              // Invalid regex, skip
              continue
            }
            break
        }

        if (isMatch) {
          matches.push(rule.keyword)

          if (messageParserConfig.logMatches) {
            logMessage(`  └ Keyword match: "${rule.keyword}" (${rule.action})`, "text-purple-400")
          }

          if (rule.action === "skip") {
            shouldSkip = true
          }
        }
      }

      return { shouldSkip, matches }
    },
    [messageParserConfig, logMessage],
  )

  const selectProxy = useCallback((): string | null => {
    const workingProxies = proxyConfigs.filter((p) => p.enabled && p.status === "working")
    if (workingProxies.length === 0) {
      return proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : null
    }

    if (proxyParserConfig.rotationEnabled) {
      // Simple round-robin rotation
      const index = Math.floor(Date.now() / (proxyParserConfig.rotationInterval * 1000)) % workingProxies.length
      const proxy = workingProxies[index]
      return `${proxy.host}:${proxy.port}`
    }

    // Random selection from working proxies
    const proxy = workingProxies[Math.floor(Math.random() * workingProxies.length)]
    return `${proxy.host}:${proxy.port}`
  }, [proxies, proxyConfigs, proxyParserConfig])

  const handleAddAccounts = (newAccounts: string[]) => {
    const uniqueNewAccounts = newAccounts.filter((a) => !accounts.includes(a))
    if (uniqueNewAccounts.length > 0) {
      const updatedAccounts = [...accounts, ...uniqueNewAccounts]
      setAccounts(updatedAccounts)
      setStats((prev) => ({ ...prev, total: updatedAccounts.length }))
      logMessage(`Added ${uniqueNewAccounts.length} new accounts.`, "text-cyan-400")
    }
  }

  const handleImportAccounts = (content: string, fileName: string) => {
    const newAccounts = content
      .split("\n")
      .map((a) => a.trim())
      .filter((a) => a.includes(":"))
    const uniqueNewAccounts = newAccounts.filter((a) => !accounts.includes(a))
    if (uniqueNewAccounts.length > 0) {
      const updatedAccounts = [...accounts, ...uniqueNewAccounts]
      setAccounts(updatedAccounts)
      setStats((prev) => ({ ...prev, total: updatedAccounts.length }))
      logMessage(`Imported ${uniqueNewAccounts.length} accounts from ${fileName}.`, "text-cyan-400")
    }
  }

  const handleClearAccounts = () => {
    setAccounts([])
    setStats((prev) => ({ ...prev, total: 0 }))
    logMessage("Account list cleared.", "text-yellow-400")
  }

  const handleAddProxies = (newProxies: string[]) => {
    const uniqueNewProxies = newProxies.filter((p) => !proxies.includes(p))
    if (uniqueNewProxies.length > 0) {
      setProxies((prev) => [...prev, ...uniqueNewProxies])
      logMessage(`Added ${uniqueNewProxies.length} new proxies.`, "text-cyan-400")
    }
  }

  const handleImportProxies = (content: string, fileName: string) => {
    const newProxies = content
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
    const uniqueNewProxies = newProxies.filter((p) => !proxies.includes(p))
    if (uniqueNewProxies.length > 0) {
      setProxies((prev) => [...prev, ...uniqueNewProxies])
      logMessage(`Imported ${uniqueNewProxies.length} proxies from ${fileName}.`, "text-cyan-400")
    }
  }

  const handleClearProxies = () => {
    setProxies([])
    setProxyConfigs([])
    logMessage("Proxy list cleared.", "text-yellow-400")
  }

  const processAccount = async (account: string) => {
    if (stopCheckingRef.current) return

    const parts = account.split(":")
    if (parts.length < 2) {
      logMessage(`Skipping malformed account: ${account}`, "text-gray-500")
      setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }))
      setResults((prev) => [
        ...prev,
        {
          email: parts[0] || account,
          status: "skipped",
          details: "Malformed account format",
          timestamp: new Date().toISOString(),
        },
      ])
      return
    }

    const email = parts[0]
    const selectedProxy = selectProxy()
    const proxyLog = selectedProxy ? ` via proxy ${selectedProxy.split(":")[0]}` : ""

    // Log active protocol
    const activeProtocol = emailProtocolConfigs.find((p) => p.enabled)
    const protocolLog = activeProtocol ? ` using ${activeProtocol.protocol}` : ""

    logMessage(`Checking: ${email}${proxyLog}${protocolLog}`, "text-gray-300")

    const result = await simulateCheckAccount(email, selectedProvider, openRouterApiKey, selectedModel)

    if (stopCheckingRef.current) return

    if (result.isValid) {
      // Simulate message content for parsing
      const simulatedMessageContent = `Welcome to ${result.provider}! You have ${result.messageCount} messages. Check your inbox for important updates.`
      const parseResult = parseMessageContent(email, simulatedMessageContent)

      if (parseResult.shouldSkip) {
        setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }))
        logMessage(`⚠ SKIPPED: ${email} - Filtered by message parser`, "text-yellow-500")
        setResults((prev) => [
          ...prev,
          {
            email,
            status: "skipped",
            details: `Filtered by keywords: ${parseResult.matches.join(", ")}`,
            timestamp: new Date().toISOString(),
            keywordMatches: parseResult.matches,
          },
        ])
        return
      }

      setStats((prev) => ({ ...prev, good: prev.good + 1 }))
      const matchInfo = parseResult.matches.length > 0 ? ` | Keywords: ${parseResult.matches.join(", ")}` : ""
      logMessage(
        `✓ GOOD: ${email} | Mails: ${result.messageCount} | Provider: ${result.provider}${matchInfo}`,
        "text-green-400",
      )
      setResults((prev) => [
        ...prev,
        {
          email,
          status: "good",
          details: `Mails: ${result.messageCount} | Provider: ${result.provider}${matchInfo}`,
          timestamp: new Date().toISOString(),
          keywordMatches: parseResult.matches,
        },
      ])

      if (isSavingAttachments && result.messageCount > 0) {
        const attachmentResult = await simulateDownloadAttachments(
          email,
          result.messageCount,
          openRouterApiKey,
          selectedModel,
        )
        if (stopCheckingRef.current) return
        logMessage(`  └ Simulated download of ${attachmentResult.downloadedCount} attachments.`, "text-cyan-400")
      }
    } else {
      setStats((prev) => ({ ...prev, bad: prev.bad + 1 }))
      logMessage(`✗ BAD: ${email} - ${result.errorMessage}`, "text-red-500")
      setResults((prev) => [
        ...prev,
        {
          email,
          status: "bad",
          details: result.errorMessage || "Unknown error",
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }

  const startChecking = async () => {
    if (accounts.length === 0) {
      logMessage("Cannot start: No accounts to check.", "text-red-500")
      return
    }
    if (!openRouterApiKey) {
      logMessage("Cannot start: OpenRouter API Key is missing. Please add it in API Settings.", "text-red-500")
      return
    }

    const activeProtocols = emailProtocolConfigs.filter((p) => p.enabled)
    if (activeProtocols.length === 0) {
      logMessage("Warning: No email protocols enabled. Using simulation mode.", "text-yellow-400")
    }

    setIsRunning(true)
    stopCheckingRef.current = false
    setStats({ good: 0, bad: 0, skipped: 0, total: accounts.length })
    setProgress(0)

    logMessage(`Starting enhanced check with model '${selectedModel}' and ${threads} threads...`, "text-yellow-400")

    if (messageParserConfig.enabled) {
      const activeRules = messageParserConfig.rules.filter((r) => r.enabled).length
      logMessage(`Message parser active with ${activeRules} rules`, "text-blue-400")
    }

    if (proxies.length > 0 || proxyConfigs.length > 0) {
      const workingProxies = proxyConfigs.filter((p) => p.enabled && p.status === "working").length
      logMessage(
        `Using ${proxies.length + workingProxies} proxies${proxyParserConfig.rotationEnabled ? " with rotation" : ""}`,
        "text-blue-400",
      )
    }

    const accountQueue = [...accounts]
    let checkedCount = 0

    const worker = async () => {
      while (accountQueue.length > 0) {
        if (stopCheckingRef.current) break
        const account = accountQueue.shift()
        if (account) {
          await processAccount(account)
          checkedCount++
          setProgress((checkedCount / accounts.length) * 100)
        }
      }
    }

    const workers = Array(threads).fill(0).map(worker)
    await Promise.all(workers)

    if (stopCheckingRef.current) {
      logMessage("Check process stopped by user.", "text-orange-500")
    } else {
      logMessage("Enhanced check process finished.", "text-yellow-400")
    }
    setIsRunning(false)
  }

  const stopChecking = () => {
    stopCheckingRef.current = true
  }

  const exportResults = (format: "txt" | "csv" | "json") => {
    if (results.length === 0) {
      logMessage("No results to export.", "text-yellow-400")
      return
    }

    let content = ""
    let filename = ""
    let mimeType = ""

    switch (format) {
      case "txt":
        content = results
          .map((r) => {
            const keywordInfo =
              r.keywordMatches && r.keywordMatches.length > 0 ? ` [Keywords: ${r.keywordMatches.join(", ")}]` : ""
            return `${r.email}:${r.status} - ${r.details}${keywordInfo}`
          })
          .join("\n")
        filename = `results_${new Date().toISOString().split("T")[0]}.txt`
        mimeType = "text/plain"
        break
      case "csv":
        content =
          "Email,Status,Details,Timestamp,Keywords\n" +
          results
            .map(
              (r) =>
                `"${r.email}","${r.status}","${r.details}","${r.timestamp}","${r.keywordMatches?.join("; ") || ""}"`,
            )
            .join("\n")
        filename = `results_${new Date().toISOString().split("T")[0]}.csv`
        mimeType = "text/csv"
        break
      case "json":
        content = JSON.stringify(results, null, 2)
        filename = `results_${new Date().toISOString().split("T")[0]}.json`
        mimeType = "application/json"
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    logMessage(`Exported ${results.length} results as ${format.toUpperCase()}.`, "text-green-400")
  }

  const exportGoodAccounts = () => {
    const goodResults = results.filter((r) => r.status === "good")
    if (goodResults.length === 0) {
      logMessage("No good accounts to export.", "text-yellow-400")
      return
    }

    const content = goodResults.map((r) => r.email).join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `good_accounts_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    logMessage(`Exported ${goodResults.length} good accounts.`, "text-green-400")
  }

  const clearResults = () => {
    setResults([])
    setStats({ good: 0, bad: 0, skipped: 0, total: accounts.length })
    logMessage("Results cleared.", "text-yellow-400")
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between pb-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Icon
              path="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              className="w-8 h-8 mr-3 text-cyan-400"
            />
            Enhanced Email Account Checker
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${emailProtocolConfigs.some((p) => p.enabled) ? "bg-green-400" : "bg-gray-400"}`}
              ></div>
              <span className="text-gray-300">Protocols</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${messageParserConfig.enabled ? "bg-blue-400" : "bg-gray-400"}`}
              ></div>
              <span className="text-gray-300">Parser</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${proxies.length > 0 || proxyConfigs.length > 0 ? "bg-purple-400" : "bg-gray-400"}`}
              ></div>
              <span className="text-gray-300">Proxies</span>
            </div>
          </div>
        </header>

        <main className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <CollapsiblePanel title="🔑 API Настройки">
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300 mb-2">
                    OpenRouter API Ключ
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="api-key-input"
                      type="password"
                      value={openRouterApiKey}
                      onChange={(e) => setOpenRouterApiKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className={`w-full bg-gray-900 border rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${
                        openRouterApiKey ? "border-green-500" : "border-gray-600"
                      }`}
                    />
                    {openRouterApiKey && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Icon
                          path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          className="w-5 h-5 text-green-400"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Получите бесплатный ключ на{" "}
                    <a
                      href="https://openrouter.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline"
                    >
                      openrouter.ai
                    </a>
                  </p>
                </div>

                <div>
                  <label htmlFor="model-select" className="block text-sm font-medium text-gray-300 mb-2">
                    AI Модель (Бесплатные)
                    <span className="text-green-400 ml-2 text-xs">FREE</span>
                  </label>
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  >
                    {OPEN_ROUTER_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
                    <p className="text-xs text-gray-300">
                      <span className="text-cyan-400 font-medium">Описание:</span>{" "}
                      {OPEN_ROUTER_MODELS.find((m) => m.id === selectedModel)?.description || "Описание недоступно"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-700">
                  <div className={`w-2 h-2 rounded-full ${openRouterApiKey ? "bg-green-400" : "bg-red-400"}`}></div>
                  <span className="text-xs text-gray-300">
                    Статус API: {openRouterApiKey ? "Готов к работе" : "Требуется ключ"}
                  </span>
                </div>
              </div>
            </CollapsiblePanel>
            <EmailProtocolSettings configs={emailProtocolConfigs} onConfigsChange={setEmailProtocolConfigs} />
            <MessageParser config={messageParserConfig} onConfigChange={setMessageParserConfig} />
            <AccountManager
              accountCount={accounts.length}
              onAdd={handleAddAccounts}
              onImport={handleImportAccounts}
              onClear={handleClearAccounts}
            />
            <ProxyManager
              proxyCount={proxies.length}
              onAdd={handleAddProxies}
              onImport={handleImportProxies}
              onClear={handleClearProxies}
            />
          </div>

          {/* Right Column: Stats, Settings, Terminal, Controls */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Good"
                value={stats.good}
                color="border-green-500"
                iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <StatCard
                label="Bad"
                value={stats.bad}
                color="border-red-500"
                iconPath="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <StatCard
                label="Skipped"
                value={stats.skipped}
                color="border-yellow-500"
                iconPath="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <StatCard
                label="Total"
                value={stats.total}
                color="border-blue-500"
                iconPath="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
              />
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-cyan-500 h-2.5 rounded-full"
                style={{ width: `${progress}%`, transition: "width 0.3s ease-in-out" }}
              ></div>
            </div>
            {/* Settings */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div className="sm:col-span-1">
                  <label htmlFor="provider-select" className="block text-sm font-medium text-gray-300 mb-1">
                    Provider Hint
                  </label>
                  <select
                    id="provider-select"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as Provider)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor="threads-slider" className="block text-sm font-medium text-gray-300 mb-1">
                    Threads: <span className="font-bold text-cyan-400">{threads}</span>
                  </label>
                  <input
                    id="threads-slider"
                    type="range"
                    min="1"
                    max="20"
                    value={threads}
                    onChange={(e) => setThreads(Number(e.target.value))}
                    disabled={isRunning}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
                  />
                </div>
                <div className="sm:col-span-1 flex items-end justify-start sm:justify-center">
                  <label htmlFor="attachment-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="attachment-toggle"
                        className="sr-only"
                        checked={isSavingAttachments}
                        onChange={() => setIsSavingAttachments(!isSavingAttachments)}
                      />
                      <div
                        className={`block ${isSavingAttachments ? "bg-cyan-500" : "bg-gray-600"} w-14 h-8 rounded-full transition-colors`}
                      ></div>
                      <div
                        className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isSavingAttachments ? "transform translate-x-6" : ""}`}
                      ></div>
                    </div>
                    <div className="ml-3 text-gray-300">Save Attachments</div>
                  </label>
                </div>
              </div>
            </div>
            {/* Terminal */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Terminal</h2>
              <Terminal logs={logs} />
            </div>
            {/* Controls */}
            <div className="flex flex-col gap-4">
              <CollapsiblePanel title={`📊 Результаты (${results.length})`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => exportResults("txt")}
                    disabled={results.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-md text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Icon
                      path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z"
                      className="w-4 h-4"
                    />
                    TXT
                  </button>
                  <button
                    onClick={() => exportResults("csv")}
                    disabled={results.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-md text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Icon
                      path="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 0C2.25 4.504 2.871 3.75 4.5 3.75h4.125c.621 0 1.125.504 1.125 1.125m-9.75 0h2.25m9.75 0v10.125c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M18 5.625c0-.621-.504-1.125-1.125-1.125h-4.125c-.621 0-1.125.504-1.125 1.125m9.75 0H21m-1.5 0H18"
                      className="w-4 h-4"
                    />
                    CSV
                  </button>
                  <button
                    onClick={() => exportResults("json")}
                    disabled={results.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-md text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Icon
                      path="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                      className="w-4 h-4"
                    />
                    JSON
                  </button>
                  <button
                    onClick={exportGoodAccounts}
                    disabled={results.filter((r) => r.status === "good").length === 0}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-md text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                    Good
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={clearResults}
                    disabled={results.length === 0}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon
                      path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      className="w-4 h-4"
                    />
                    Очистить результаты
                  </button>
                </div>
              </CollapsiblePanel>

              <div className="flex gap-4">
                {!isRunning ? (
                  <button
                    onClick={startChecking}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={accounts.length === 0 || !openRouterApiKey}
                  >
                    <Icon
                      path="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                      className="w-6 h-6"
                    />
                    НАЧАТЬ ПРОВЕРКУ
                  </button>
                ) : (
                  <button
                    onClick={stopChecking}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon
                      path="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
                      className="w-6 h-6"
                    />
                    ОСТАНОВИТЬ
                  </button>
                )}
                <button
                  onClick={() => setLogs([])}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <Icon
                    path="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                    className="w-5 h-5"
                  />
                  Очистить логи
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
