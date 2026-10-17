'use strict';

// Integración opcional con Claude para preguntas abiertas de programación.
// Solo se activa si ANTHROPIC_API_KEY está definida.

const DEFAULT_MODEL = 'claude-opus-5-5';
// Alexa corta la respuesta de la skill a los 8 segundos; dejamos margen para el resto del handler.
const REQUEST_TIMEOUT_MS = 7000;
// Modelos que aceptan `fallbacks: "default"` (re-ejecuta en otro modelo si el primero rechaza la petición).
const FALLBACK_MODELS = new Set(['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5']);

const SYSTEM_PROMPT = [
  'Eres un asistente de programación que responde por voz a través de Alexa, en español de México.',
  'Latency-sensitive; begin your visible answer immediately.',
  'Responde en máximo tres oraciones cortas, claras y naturales para escucharse.',
  'No uses Markdown, listas, emojis ni bloques de código: describe el código con palabras,',
  'por ejemplo "usa el método map del arreglo". Si la pregunta no es de tecnología, responde breve y amable.',
].join(' ');

let client;

function isEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient() {
  if (!client) {
    const Anthropic = require('@anthropic-ai/sdk');
    client = new Anthropic({ timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
  }
  return client;
}

// Quita formato que no tiene sentido en voz.
function toSpeakable(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[*_#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pregunta a Claude y devuelve { speech, text } o lanza un error.
 * `speech` es la versión apta para voz; `text` la respuesta completa para la tarjeta.
 */
async function askClaude(question) {
  const model = process.env.SKILL_CLAUDE_MODEL || DEFAULT_MODEL;
  const params = {
    model,
    max_tokens: 2048,
    output_config: { effort: process.env.SKILL_CLAUDE_EFFORT || 'low' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: question }],
  };
  if (FALLBACK_MODELS.has(model)) {
    params.betas = ['server-side-fallback-2026-07-01'];
    params.fallbacks = 'default';
  }

  const response = await getClient().beta.messages.create(params);
  if (response.stop_reason === 'refusal') {
    return { speech: 'Prefiero no responder esa pregunta. Intenta formularla de otra manera.', text: '' };
  }
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join(' ')
    .trim();
  if (!text) throw new Error(`Respuesta vacía de Claude (stop_reason: ${response.stop_reason})`);
  return { speech: toSpeakable(text), text };
}

module.exports = { isEnabled, askClaude, toSpeakable };
