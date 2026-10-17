'use strict';

const Alexa = require('ask-sdk-core');

const SKILL_NAME = 'Asistente de Código';
const FOLLOW_UP = '¿Qué más necesitas?';

// El SDK envuelve el texto en <speak>, así que hay que escapar los caracteres especiales de SSML.
function escapeSsml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function normalize(value) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

// Devuelve el id resuelto por entity resolution (sinónimos) o, si no hubo match, null.
function getResolvedSlotId(requestEnvelope, slotName) {
  const slot = Alexa.getSlot(requestEnvelope, slotName);
  const authorities = slot?.resolutions?.resolutionsPerAuthority ?? [];
  for (const authority of authorities) {
    if (authority.status?.code === 'ER_SUCCESS_MATCH' && authority.values?.length) {
      return authority.values[0].value.id;
    }
  }
  return null;
}

// Busca un elemento por id resuelto o, como respaldo, por coincidencia exacta con algún sinónimo.
function findEntry(entries, requestEnvelope, slotName) {
  const id = getResolvedSlotId(requestEnvelope, slotName);
  if (id) {
    const byId = entries.find((entry) => entry.id === id);
    if (byId) return byId;
  }
  const raw = normalize(Alexa.getSlotValue(requestEnvelope, slotName));
  if (!raw) return null;
  return entries.find((entry) => entry.synonyms.some((s) => normalize(s) === raw)) ?? null;
}

function isIntent(handlerInput, ...names) {
  return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
    && names.includes(Alexa.getIntentName(handlerInput.requestEnvelope));
}

// Responde con voz + tarjeta en la app de Alexa y deja la sesión abierta para otra pregunta.
// `speech` ya debe ser SSML seguro (usa escapeSsml para el texto dinámico).
function answer(handlerInput, { speech, cardTitle, cardText, reprompt = FOLLOW_UP }) {
  const builder = handlerInput.responseBuilder.speak(`${speech} ${reprompt}`).reprompt(reprompt);
  if (cardTitle && cardText) builder.withSimpleCard(cardTitle, cardText);
  return builder.getResponse();
}

module.exports = { SKILL_NAME, FOLLOW_UP, escapeSsml, pick, normalize, getResolvedSlotId, findEntry, isIntent, answer };
