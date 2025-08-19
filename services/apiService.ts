import type { EmailCheckResult, AttachmentResult } from "../types"

const API_URL = "https://openrouter.ai/api/v1/chat/completions"
const APP_URL = "https://example.com/app" // A placeholder URL for the referrer header
const APP_TITLE = "Gemini Email Account Checker"

const callOpenRouter = async (prompt: string, apiKey: string, model: string): Promise<any> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing.")
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": APP_URL,
      "X-Title": APP_TITLE,
    },
    body: JSON.stringify({
      model: model,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `API Error: ${response.status} ${response.statusText} - ${errorData?.error?.message || "Unknown error"}`,
    )
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error("Invalid response structure from API.")
  }

  return JSON.parse(content)
}

export const simulateCheckAccount = async (
  email: string,
  provider: string,
  apiKey: string,
  model: string,
): Promise<EmailCheckResult> => {
  try {
    const prompt = `
            Simulate checking the validity of the email account: ${email}. 
            The user has selected the provider hint: "${provider}". 
            Base your response on common success or failure scenarios for email login.
            Your response MUST be a single, valid JSON object with the following keys:
            - "isValid" (boolean): Whether the credentials are valid.
            - "errorMessage" (string): A realistic error message if isValid is false (e.g., "Invalid credentials", "Connection timed out"), otherwise an empty string.
            - "messageCount" (integer): A random number of emails between 0 and 250 if isValid is true, otherwise 0.
            - "provider" (string): The detected email provider (e.g., Gmail, Yahoo).
        `

    const result = await callOpenRouter(prompt, apiKey, model)

    return {
      isValid: result.isValid ?? false,
      errorMessage: result.errorMessage ?? "Invalid JSON response",
      messageCount: result.messageCount ?? 0,
      provider: result.provider ?? "Unknown",
    }
  } catch (error) {
    console.error("Error simulating account check:", error)
    const errorMessage = error instanceof Error ? error.message : "API call failed."
    return {
      isValid: false,
      errorMessage: errorMessage,
      messageCount: 0,
      provider: "Unknown",
    }
  }
}

export const simulateDownloadAttachments = async (
  email: string,
  messageCount: number,
  apiKey: string,
  model: string,
): Promise<AttachmentResult> => {
  try {
    const prompt = `
            Simulate finding and downloading attachments for the email account ${email}, which has ${messageCount} total emails. 
            Only a few recent emails might have attachments.
            Your response MUST be a single, valid JSON object with one key:
            - "downloadedCount" (integer): A realistic number of attachments 'downloaded', from 0 to 5.
         `

    const result = await callOpenRouter(prompt, apiKey, model)

    return {
      downloadedCount: result.downloadedCount ?? 0,
    }
  } catch (error) {
    console.error("Error simulating attachment download:", error)
    return {
      downloadedCount: 0,
    }
  }
}
