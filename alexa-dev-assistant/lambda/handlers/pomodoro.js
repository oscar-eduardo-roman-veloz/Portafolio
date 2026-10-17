'use strict';

const Alexa = require('ask-sdk-core');
const { isIntent } = require('../lib/speech');

const TIMERS_PERMISSION = 'alexa::alerts:timers:skill:readwrite';
const DEFAULT_MINUTES = 25;
const MAX_MINUTES = 120;

function hasTimersPermission(requestEnvelope) {
  const scopes = requestEnvelope.context?.System?.user?.permissions?.scopes;
  return scopes?.[TIMERS_PERMISSION]?.status === 'GRANTED';
}

function parseMinutes(value) {
  const minutes = Number(value);
  if (!Number.isInteger(minutes) || minutes < 1) return DEFAULT_MINUTES;
  return Math.min(minutes, MAX_MINUTES);
}

async function startTimer(handlerInput, minutes) {
  const locale = Alexa.getLocale(handlerInput.requestEnvelope);
  const timer = {
    duration: `PT${minutes}M`,
    timerLabel: 'Pomodoro',
    creationBehavior: { displayExperience: { visibility: 'VISIBLE' } },
    triggeringBehavior: {
      operation: {
        type: 'ANNOUNCE',
        textToAnnounce: [{ locale, text: 'Terminó tu pomodoro. Levántate, estírate y toma agua cinco minutos.' }],
      },
      notificationConfig: { playAudible: true },
    },
  };
  try {
    await handlerInput.serviceClientFactory.getTimerManagementServiceClient().createTimer(timer);
    return handlerInput.responseBuilder
      .speak(`Listo, pomodoro de ${minutes} minutos en marcha. Cierra el chat, silencia notificaciones y a programar.`)
      .withShouldEndSession(true)
      .getResponse();
  } catch (error) {
    console.error('Error creando el temporizador:', error);
    return handlerInput.responseBuilder
      .speak('No pude crear el temporizador. Revisa que la skill tenga permiso de temporizadores en la app de Alexa.')
      .withShouldEndSession(true)
      .getResponse();
  }
}

// Pide el permiso por voz; Alexa responde después con un Connections.Response.
// Guardamos los minutos en el token porque llegan en una petición nueva.
function askForPermission(handlerInput, minutes) {
  return handlerInput.responseBuilder
    .addDirective({
      type: 'Connections.SendRequest',
      name: 'AskFor',
      payload: {
        '@type': 'AskForPermissionsConsentRequest',
        '@version': '1',
        permissionScope: TIMERS_PERMISSION,
      },
      token: `pomodoro:${minutes}`,
    })
    .getResponse();
}

const PomodoroIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'PomodoroIntent'),
  handle(handlerInput) {
    const minutes = parseMinutes(Alexa.getSlotValue(handlerInput.requestEnvelope, 'minutes'));
    if (!hasTimersPermission(handlerInput.requestEnvelope)) {
      return askForPermission(handlerInput, minutes);
    }
    return startTimer(handlerInput, minutes);
  },
};

const PermissionResponseHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'Connections.Response' && request.name === 'AskFor';
  },
  handle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const status = request.payload?.status;
    if (status === 'ACCEPTED') {
      const minutes = parseMinutes(String(request.token ?? '').split(':')[1]);
      return startTimer(handlerInput, minutes);
    }
    const speech = status === 'DENIED'
      ? 'Sin el permiso de temporizadores no puedo iniciar el pomodoro. Puedes activarlo después en la app de Alexa.'
      : 'Está bien. Cuando quieras, pídeme otra vez un pomodoro.';
    return handlerInput.responseBuilder.speak(speech).withShouldEndSession(true).getResponse();
  },
};

module.exports = { PomodoroIntentHandler, PermissionResponseHandler, TIMERS_PERMISSION };
