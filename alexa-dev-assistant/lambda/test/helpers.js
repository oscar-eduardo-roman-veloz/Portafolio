'use strict';

const { skill } = require('../index');

const LOCALE = 'es-MX';

function envelope(request, { sessionAttributes = {}, permissions } = {}) {
  return {
    version: '1.0',
    session: {
      new: false,
      sessionId: 'amzn1.echo-api.session.test',
      application: { applicationId: 'amzn1.ask.skill.test' },
      attributes: sessionAttributes,
      user: { userId: 'amzn1.ask.account.test' },
    },
    context: {
      System: {
        application: { applicationId: 'amzn1.ask.skill.test' },
        user: { userId: 'amzn1.ask.account.test', ...(permissions && { permissions }) },
        device: { deviceId: 'amzn1.ask.device.test', supportedInterfaces: {} },
        apiEndpoint: 'https://api.amazonalexa.com',
        apiAccessToken: 'test-token',
      },
    },
    request: { requestId: 'amzn1.echo-api.request.test', timestamp: new Date().toISOString(), locale: LOCALE, ...request },
  };
}

// slots: { nombre: 'valor' } o { nombre: { value, id } } para simular entity resolution.
function intentRequest(name, slots = {}, options) {
  const slotObjects = {};
  for (const [slotName, spec] of Object.entries(slots)) {
    const { value, id } = typeof spec === 'object' ? spec : { value: spec };
    slotObjects[slotName] = { name: slotName, value, confirmationStatus: 'NONE' };
    if (id) {
      slotObjects[slotName].resolutions = {
        resolutionsPerAuthority: [{ status: { code: 'ER_SUCCESS_MATCH' }, values: [{ value: { name: value, id } }] }],
      };
    }
  }
  return envelope({ type: 'IntentRequest', dialogState: 'COMPLETED', intent: { name, confirmationStatus: 'NONE', slots: slotObjects } }, options);
}

function speechOf(responseEnvelope) {
  return responseEnvelope.response.outputSpeech?.ssml ?? '';
}

module.exports = { skill, envelope, intentRequest, speechOf };
