"use client"

import type React from "react"
import { useState } from "react"
import Icon from "./Icon"
import CollapsiblePanel from "./CollapsiblePanel"

export interface EmailProtocolConfig {
  protocol: "IMAP" | "POP3" | "SMTP"
  host: string
  port: number
  encryption: "SSL" | "TLS" | "None"
  timeout: number
  enabled: boolean
}

interface EmailProtocolSettingsProps {
  configs: EmailProtocolConfig[]
  onConfigsChange: (configs: EmailProtocolConfig[]) => void
}

const DEFAULT_CONFIGS: EmailProtocolConfig[] = [
  { protocol: "IMAP", host: "imap.gmail.com", port: 993, encryption: "SSL", timeout: 10, enabled: true },
  { protocol: "POP3", host: "pop.gmail.com", port: 995, encryption: "SSL", timeout: 10, enabled: false },
  { protocol: "SMTP", host: "smtp.gmail.com", port: 587, encryption: "TLS", timeout: 10, enabled: false },
]

const EmailProtocolSettings: React.FC<EmailProtocolSettingsProps> = ({ configs, onConfigsChange }) => {
  const [selectedProtocol, setSelectedProtocol] = useState<"IMAP" | "POP3" | "SMTP">("IMAP")

  const updateConfig = (protocol: "IMAP" | "POP3" | "SMTP", updates: Partial<EmailProtocolConfig>) => {
    const newConfigs = configs.map((config) => (config.protocol === protocol ? { ...config, ...updates } : config))
    onConfigsChange(newConfigs)
  }

  const resetToDefaults = () => {
    onConfigsChange([...DEFAULT_CONFIGS])
  }

  const currentConfig = configs.find((c) => c.protocol === selectedProtocol) || DEFAULT_CONFIGS[0]

  return (
    <CollapsiblePanel title="📧 Настройки Email Протоколов">
      <div className="flex flex-col gap-4">
        {/* Protocol Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Выберите протокол</label>
          <div className="flex gap-2">
            {["IMAP", "POP3", "SMTP"].map((protocol) => (
              <button
                key={protocol}
                onClick={() => setSelectedProtocol(protocol as "IMAP" | "POP3" | "SMTP")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedProtocol === protocol
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {protocol}
                {configs.find((c) => c.protocol === protocol)?.enabled && (
                  <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Protocol Configuration */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Настройки {selectedProtocol}</h3>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={currentConfig.enabled}
                  onChange={(e) => updateConfig(selectedProtocol, { enabled: e.target.checked })}
                />
                <div
                  className={`block ${currentConfig.enabled ? "bg-green-500" : "bg-gray-600"} w-12 h-6 rounded-full transition-colors`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    currentConfig.enabled ? "transform translate-x-6" : ""
                  }`}
                ></div>
              </div>
              <span className="ml-3 text-sm text-gray-300">Включен</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Host */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Хост сервера</label>
              <input
                type="text"
                value={currentConfig.host}
                onChange={(e) => updateConfig(selectedProtocol, { host: e.target.value })}
                placeholder="imap.gmail.com"
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Порт</label>
              <input
                type="number"
                value={currentConfig.port}
                onChange={(e) => updateConfig(selectedProtocol, { port: Number.parseInt(e.target.value) || 993 })}
                min="1"
                max="65535"
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Encryption */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Шифрование</label>
              <select
                value={currentConfig.encryption}
                onChange={(e) =>
                  updateConfig(selectedProtocol, { encryption: e.target.value as "SSL" | "TLS" | "None" })
                }
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="SSL">SSL</option>
                <option value="TLS">TLS</option>
                <option value="None">Без шифрования</option>
              </select>
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Таймаут (сек)</label>
              <input
                type="number"
                value={currentConfig.timeout}
                onChange={(e) => updateConfig(selectedProtocol, { timeout: Number.parseInt(e.target.value) || 10 })}
                min="5"
                max="60"
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Protocol Info */}
          <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-600">
            <div className="flex items-start gap-2">
              <Icon
                path="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0"
              />
              <div className="text-xs text-gray-300">
                {selectedProtocol === "IMAP" && (
                  <p>
                    <strong>IMAP:</strong> Позволяет читать письма, оставляя их на сервере. Поддерживает папки и
                    синхронизацию.
                  </p>
                )}
                {selectedProtocol === "POP3" && (
                  <p>
                    <strong>POP3:</strong> Скачивает письма на устройство и обычно удаляет их с сервера. Простой
                    протокол.
                  </p>
                )}
                {selectedProtocol === "SMTP" && (
                  <p>
                    <strong>SMTP:</strong> Используется для отправки писем. Требует аутентификацию для предотвращения
                    спама.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={resetToDefaults}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center gap-2"
          >
            <Icon
              path="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              className="w-4 h-4"
            />
            Сбросить к умолчанию
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <div
              className={`w-2 h-2 rounded-full ${configs.some((c) => c.enabled) ? "bg-green-400" : "bg-gray-400"}`}
            ></div>
            <span className="text-xs text-gray-300">
              {configs.filter((c) => c.enabled).length} из {configs.length} протоколов активно
            </span>
          </div>
        </div>
      </div>
    </CollapsiblePanel>
  )
}

export default EmailProtocolSettings
