"use client"

import type React from "react"
import { useState } from "react"
import type { KeywordRule, MessageParserConfig } from "../types"
import Icon from "./Icon"
import CollapsiblePanel from "./CollapsiblePanel"

interface MessageParserProps {
  config: MessageParserConfig
  onConfigChange: (config: MessageParserConfig) => void
}

const MessageParser: React.FC<MessageParserProps> = ({ config, onConfigChange }) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [selectedMatchType, setSelectedMatchType] = useState<"exact" | "contains" | "regex">("contains")
  const [selectedPriority, setSelectedPriority] = useState<"high" | "medium" | "low">("medium")
  const [selectedAction, setSelectedAction] = useState<"flag" | "skip" | "priority">("flag")

  const addKeywordRule = () => {
    if (!newKeyword.trim()) return

    const newRule: KeywordRule = {
      id: Date.now().toString(),
      keyword: newKeyword.trim(),
      matchType: selectedMatchType,
      priority: selectedPriority,
      action: selectedAction,
      enabled: true,
      caseSensitive: false,
    }

    onConfigChange({
      ...config,
      rules: [...config.rules, newRule],
    })

    setNewKeyword("")
  }

  const updateRule = (id: string, updates: Partial<KeywordRule>) => {
    onConfigChange({
      ...config,
      rules: config.rules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)),
    })
  }

  const deleteRule = (id: string) => {
    onConfigChange({
      ...config,
      rules: config.rules.filter((rule) => rule.id !== id),
    })
  }

  const clearAllRules = () => {
    onConfigChange({
      ...config,
      rules: [],
    })
  }

  const importRules = (content: string) => {
    const keywords = content
      .split("\n")
      .map((k) => k.trim())
      .filter(Boolean)

    const newRules: KeywordRule[] = keywords.map((keyword) => ({
      id: Date.now().toString() + Math.random(),
      keyword,
      matchType: "contains" as const,
      priority: "medium" as const,
      action: "flag" as const,
      enabled: true,
      caseSensitive: false,
    }))

    onConfigChange({
      ...config,
      rules: [...config.rules, ...newRules],
    })
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      importRules(content)
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400"
      case "medium":
        return "text-yellow-400"
      case "low":
        return "text-green-400"
      default:
        return "text-gray-400"
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "flag":
        return "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
      case "skip":
        return "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
      case "priority":
        return "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      default:
        return "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
    }
  }

  return (
    <CollapsiblePanel title="🔍 Парсер Сообщений по Ключевым Словам">
      <div className="flex flex-col gap-4">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div>
            <h3 className="text-sm font-medium text-white">Парсер Сообщений</h3>
            <p className="text-xs text-gray-400">Анализ содержимого email по ключевым словам</p>
          </div>
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={config.enabled}
                onChange={(e) => onConfigChange({ ...config, enabled: e.target.checked })}
              />
              <div
                className={`block ${config.enabled ? "bg-cyan-500" : "bg-gray-600"} w-12 h-6 rounded-full transition-colors`}
              ></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  config.enabled ? "transform translate-x-6" : ""
                }`}
              ></div>
            </div>
          </label>
        </div>

        {config.enabled && (
          <>
            {/* Add New Rule */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-white mb-3">Добавить Правило</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Ключевое слово</label>
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Введите ключевое слово..."
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    onKeyPress={(e) => e.key === "Enter" && addKeywordRule()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Тип поиска</label>
                  <select
                    value={selectedMatchType}
                    onChange={(e) => setSelectedMatchType(e.target.value as "exact" | "contains" | "regex")}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="contains">Содержит</option>
                    <option value="exact">Точное совпадение</option>
                    <option value="regex">Регулярное выражение</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Приоритет</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as "high" | "medium" | "low")}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Действие</label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value as "flag" | "skip" | "priority")}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="flag">Отметить</option>
                    <option value="skip">Пропустить</option>
                    <option value="priority">Приоритет</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addKeywordRule}
                  disabled={!newKeyword.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center gap-2"
                >
                  <Icon path="M12 4.5v15m7.5-7.5h-15" className="w-4 h-4" />
                  Добавить
                </button>

                <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center gap-2 cursor-pointer">
                  <Icon
                    path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    className="w-4 h-4"
                  />
                  Импорт
                  <input type="file" accept=".txt,.csv" onChange={handleFileImport} className="hidden" />
                </label>

                {config.rules.length > 0 && (
                  <button
                    onClick={clearAllRules}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center gap-2"
                  >
                    <Icon
                      path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      className="w-4 h-4"
                    />
                    Очистить все
                  </button>
                )}
              </div>
            </div>

            {/* Rules List */}
            {config.rules.length > 0 && (
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white">Правила ({config.rules.length})</h4>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center cursor-pointer text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={config.logMatches}
                        onChange={(e) => onConfigChange({ ...config, logMatches: e.target.checked })}
                        className="mr-1"
                      />
                      Логировать совпадения
                    </label>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {config.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-600"
                    >
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                          className="mr-2"
                        />
                      </label>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-white truncate">{rule.keyword}</span>
                          <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(rule.priority)} bg-gray-800`}>
                            {rule.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{rule.matchType}</span>
                          <span>•</span>
                          <span>{rule.action}</span>
                          {rule.caseSensitive && (
                            <>
                              <span>•</span>
                              <span>Aa</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Icon path={getActionIcon(rule.action)} className="w-4 h-4 text-gray-400" />

                        <button
                          onClick={() => updateRule(rule.id, { caseSensitive: !rule.caseSensitive })}
                          className={`p-1 rounded text-xs ${
                            rule.caseSensitive ? "bg-cyan-600 text-white" : "bg-gray-700 text-gray-400"
                          }`}
                          title="Учитывать регистр"
                        >
                          Aa
                        </button>

                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Удалить правило"
                        >
                          <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-white mb-3">Настройки Парсера</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Действие по умолчанию</label>
                  <select
                    value={config.defaultAction}
                    onChange={(e) =>
                      onConfigChange({ ...config, defaultAction: e.target.value as "accept" | "reject" })
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="accept">Принимать</option>
                    <option value="reject">Отклонять</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Что делать с сообщениями без совпадений</p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${config.rules.filter((r) => r.enabled).length > 0 ? "bg-green-400" : "bg-gray-400"}`}
                  ></div>
                  <span className="text-xs text-gray-300">
                    {config.rules.filter((r) => r.enabled).length} активных правил из {config.rules.length}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </CollapsiblePanel>
  )
}

export default MessageParser
