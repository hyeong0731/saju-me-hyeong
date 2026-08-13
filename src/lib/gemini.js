import { GoogleGenAI } from '@google/genai'
import { SAJU_SYSTEM_PROMPT, buildSajuUserPrompt } from './sajuPrompt'

// Vite에서는 VITE_로 시작하는 환경변수만 프론트에서 읽을 수 있어요.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY

const ai = new GoogleGenAI({ apiKey })

export async function interpretSaju(formData) {
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY가 .env에 없습니다. 저장 후 개발 서버를 다시 켜 주세요.')
  }

  // Interactions API: system_instruction에 기본 컨텍스트, input에 사용자 입력
  // gemini-3.6-flash에서는 temperature / top_p / top_k를 보내지 않아요.
  const interaction = await ai.interactions.create({
    model: 'gemini-3.6-flash',
    system_instruction: SAJU_SYSTEM_PROMPT,
    input: buildSajuUserPrompt(formData),
  })

  const text = interaction.output_text?.trim()
  if (!text) {
    throw new Error('Gemini가 빈 응답을 보냈습니다. 잠시 후 다시 시도해 주세요.')
  }

  return text
}
