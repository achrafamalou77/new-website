import OpenAI from 'openai'

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  return new OpenAI({ apiKey })
}

export const AGENT_MODEL = process.env.OPENAI_AGENT_MODEL || 'gpt-4o'
