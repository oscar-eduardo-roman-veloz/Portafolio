'use strict';

const { isIntent } = require('../lib/speech');

// Rubber duck debugging: Alexa hace preguntas guía y tú explicas el problema en voz alta.
const QUESTIONS = [
  'Cuéntame en una frase qué debería hacer tu código.',
  '¿Y qué está haciendo en realidad? Describe el síntoma exacto, con el mensaje de error si lo hay.',
  '¿Cuál fue el último cambio antes de que empezara a fallar?',
  '¿Puedes reproducirlo siempre, o solo a veces? Si es a veces, piensa en concurrencia, caché o datos distintos.',
  'Recorre la función línea por línea en voz alta y di qué valor esperas en cada variable.',
  '¿Revisaste los datos de entrada? Nulos, cadenas vacías, tipos inesperados o listas vacías.',
  '¿Qué estás dando por hecho que podrías comprobar con un log o un breakpoint?',
];
const CLOSING = 'Si todavía no lo encuentras, reduce el problema al ejemplo más pequeño que siga fallando. Muchas veces el bug aparece solo. ¡Suerte!';
const REPROMPT = 'Explícamelo en voz alta. Cuando termines, di: siguiente.';

function isDuckMode(handlerInput) {
  return handlerInput.attributesManager.getSessionAttributes().duckStep !== undefined;
}

function askStep(handlerInput, step, prefix = '') {
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  if (step >= QUESTIONS.length) {
    delete attributes.duckStep;
    return handlerInput.responseBuilder.speak(`${prefix}${CLOSING}`).withShouldEndSession(true).getResponse();
  }
  attributes.duckStep = step;
  return handlerInput.responseBuilder.speak(`${prefix}${QUESTIONS[step]}`).reprompt(REPROMPT).getResponse();
}

const RubberDuckIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'RubberDuckIntent'),
  handle(handlerInput) {
    return askStep(handlerInput, 0, 'Cuac. Modo patito activado. Te haré preguntas; respóndelas en voz alta y di siguiente para avanzar. ');
  },
};

// "siguiente", "listo"... o cualquier explicación que caiga en FallbackIntent avanza a la siguiente pregunta.
const DuckNextHandler = {
  canHandle: (handlerInput) => isDuckMode(handlerInput)
    && isIntent(handlerInput, 'AMAZON.NextIntent', 'AMAZON.YesIntent', 'AMAZON.FallbackIntent'),
  handle(handlerInput) {
    const { duckStep } = handlerInput.attributesManager.getSessionAttributes();
    return askStep(handlerInput, duckStep + 1, 'Ajá. ');
  },
};

const DuckFoundIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'DuckFoundIntent'),
  handle(handlerInput) {
    delete handlerInput.attributesManager.getSessionAttributes().duckStep;
    return handlerInput.responseBuilder
      .speak('¡Cuac cuac! Sabía que lo ibas a encontrar. Ahora escribe una prueba para que no regrese.')
      .withShouldEndSession(true)
      .getResponse();
  },
};

module.exports = { RubberDuckIntentHandler, DuckNextHandler, DuckFoundIntentHandler, QUESTIONS };
