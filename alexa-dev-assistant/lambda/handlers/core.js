'use strict';

const Alexa = require('ask-sdk-core');
const claude = require('../lib/claude');
const { SKILL_NAME, isIntent } = require('../lib/speech');

const EXAMPLES = 'Puedes preguntarme qué significa el código 404, cómo deshago el último commit, qué es un closure, '
  + 'convertir 255 a hexadecimal, generar un UUID, iniciar un pomodoro, activar el modo patito '
  + 'o cómo va mi repositorio.';

function helpSpeech() {
  const extra = claude.isEnabled() ? ' Y para cualquier otra duda, di: pregunta, y tu pregunta.' : '';
  return `${EXAMPLES}${extra}`;
}

const LaunchRequestHandler = {
  canHandle: (handlerInput) => Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest',
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(`Hola, soy tu ${SKILL_NAME}. ¿En qué te ayudo a programar hoy?`)
      .reprompt(helpSpeech())
      .getResponse();
  },
};

// "Sí" o "siguiente" fuera del modo patito (p. ej. tras "¿Qué más necesitas?") se responden con la ayuda.
const HelpIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'AMAZON.HelpIntent', 'AMAZON.YesIntent', 'AMAZON.NextIntent'),
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak(`${helpSpeech()} ¿Qué quieres hacer?`).reprompt('¿Qué quieres hacer?').getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'AMAZON.CancelIntent', 'AMAZON.StopIntent', 'AMAZON.NoIntent', 'AMAZON.NavigateHomeIntent'),
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak('¡Hasta luego, y que compile a la primera!').withShouldEndSession(true).getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'AMAZON.FallbackIntent'),
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(`No entendí eso. ${helpSpeech()}`)
      .reprompt('¿Qué quieres hacer?')
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle: (handlerInput) => Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest',
  handle(handlerInput) {
    console.log('Sesión terminada:', JSON.stringify(handlerInput.requestEnvelope.request.reason));
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle: () => true,
  handle(handlerInput, error) {
    console.error('Error no controlado:', error);
    return handlerInput.responseBuilder
      .speak('Ups, algo falló de mi lado. Inténtalo de nuevo.')
      .reprompt('¿Qué quieres hacer?')
      .getResponse();
  },
};

module.exports = {
  LaunchRequestHandler,
  HelpIntentHandler,
  CancelAndStopIntentHandler,
  FallbackIntentHandler,
  SessionEndedRequestHandler,
  ErrorHandler,
};
