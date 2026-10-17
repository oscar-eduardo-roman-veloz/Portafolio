'use strict';

const Alexa = require('ask-sdk-core');
const claude = require('../lib/claude');
const { escapeSsml, isIntent, answer } = require('../lib/speech');

// Progressive response: Alexa dice algo mientras esperamos a Claude. Si falla, no es grave.
async function sendThinkingNotice(handlerInput) {
  try {
    await handlerInput.serviceClientFactory.getDirectiveServiceClient().enqueue({
      header: { requestId: handlerInput.requestEnvelope.request.requestId },
      directive: { type: 'VoicePlayer.Speak', speech: 'Déjame pensarlo.' },
    });
  } catch (error) {
    console.warn('No se pudo enviar la respuesta progresiva:', error.message);
  }
}

async function answerWithClaude(handlerInput, question, cardTitle = 'Respuesta de Claude') {
  if (!claude.isEnabled()) {
    return answer(handlerInput, {
      speech: 'Las preguntas abiertas necesitan una llave de la API de Claude. Configura ANTHROPIC_API_KEY y vuelve a intentarlo.',
    });
  }
  try {
    const [, result] = await Promise.all([sendThinkingNotice(handlerInput), claude.askClaude(question)]);
    return answer(handlerInput, {
      speech: escapeSsml(result.speech),
      cardTitle,
      cardText: result.text ? `${question}\n\n${result.text}` : undefined,
    });
  } catch (error) {
    console.error('Error consultando a Claude:', error);
    return answer(handlerInput, {
      speech: 'No pude obtener respuesta a tiempo. Intenta con una pregunta más corta.',
    });
  }
}

const AskClaudeIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'AskClaudeIntent'),
  handle(handlerInput) {
    const question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'question');
    if (!question) {
      return handlerInput.responseBuilder
        .speak('¿Cuál es tu pregunta? Por ejemplo: pregunta cómo invierto una lista en Python.')
        .reprompt('Dime: pregunta, y luego tu duda.')
        .getResponse();
    }
    return answerWithClaude(handlerInput, question);
  },
};

module.exports = { AskClaudeIntentHandler, answerWithClaude };
