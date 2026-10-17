'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const Alexa = require('ask-sdk-core');
const claude = require('../lib/claude');
const { buildModel } = require('../../scripts/build-model');
const { QUESTIONS } = require('../handlers/duck');
const { skill, envelope, intentRequest, speechOf } = require('./helpers');

// Interceptamos las llamadas a las APIs de Alexa (timers, respuestas progresivas) para no salir a la red.
let apiCalls;
const originalInvoke = Alexa.DefaultApiClient.prototype.invoke;
const originalFetch = global.fetch;
const originalAskClaude = claude.askClaude;

beforeEach(() => {
  apiCalls = [];
  Alexa.DefaultApiClient.prototype.invoke = async (request) => {
    apiCalls.push(request);
    return { statusCode: 200, headers: [], body: '{}' };
  };
  delete process.env.ANTHROPIC_API_KEY;
});

afterEach(() => {
  Alexa.DefaultApiClient.prototype.invoke = originalInvoke;
  global.fetch = originalFetch;
  claude.askClaude = originalAskClaude;
});

test('LaunchRequest saluda y deja la sesión abierta', async () => {
  const res = await skill.invoke(envelope({ type: 'LaunchRequest' }));
  assert.match(speechOf(res), /Hola/);
  assert.notEqual(res.response.shouldEndSession, true);
});

test('HttpStatusIntent explica un código conocido', async () => {
  const res = await skill.invoke(intentRequest('HttpStatusIntent', { code: '404' }));
  assert.match(speechOf(res), /Not Found/);
  assert.equal(res.response.card.title, 'HTTP 404 Not Found');
});

test('HttpStatusIntent escapa caracteres SSML', async () => {
  const res = await skill.invoke(intentRequest('HttpStatusIntent', { code: '418' }));
  assert.match(speechOf(res), /I&apos;m a teapot/);
});

test('HttpStatusIntent con código desconocido da una pista', async () => {
  const res = await skill.invoke(intentRequest('HttpStatusIntent', { code: '299' }));
  assert.match(speechOf(res), /No tengo el código 299/);
});

test('GitCommandIntent usa el id resuelto y manda el comando a la tarjeta', async () => {
  const res = await skill.invoke(intentRequest('GitCommandIntent', { task: { value: 'quitar el último commit', id: 'UNDO_LAST_COMMIT' } }));
  assert.match(speechOf(res), /git reset/);
  assert.match(res.response.card.content, /git reset --soft HEAD~1/);
});

test('GitCommandIntent encuentra la receta por sinónimo sin entity resolution', async () => {
  const res = await skill.invoke(intentRequest('GitCommandIntent', { task: 'Crear una rama' }));
  assert.match(res.response.card.content, /git switch -c/);
});

test('GitCommandIntent desconocido sin Claude sugiere ejemplos', async () => {
  const res = await skill.invoke(intentRequest('GitCommandIntent', { task: 'hacer magia' }));
  assert.match(speechOf(res), /No tengo esa receta/);
});

test('ConceptIntent explica un concepto del glosario', async () => {
  const res = await skill.invoke(intentRequest('ConceptIntent', { concept: { value: 'closure', id: 'CLOSURE' } }));
  assert.match(speechOf(res), /recuerda las variables/);
});

test('ConceptIntent desconocido recurre a Claude si está configurado', async () => {
  process.env.ANTHROPIC_API_KEY = 'test';
  let asked;
  claude.askClaude = async (question) => {
    asked = question;
    return { speech: 'Rust es un lenguaje de sistemas <seguro>.', text: 'Rust es un lenguaje de sistemas.' };
  };
  const res = await skill.invoke(intentRequest('ConceptIntent', { concept: 'rust' }));
  assert.match(asked, /rust/);
  assert.match(speechOf(res), /Rust es un lenguaje de sistemas &lt;seguro&gt;/);
  assert.ok(apiCalls.some((call) => call.url.includes('/v1/directives')), 'envía respuesta progresiva');
});

test('AskClaudeIntent sin API key explica cómo configurarla', async () => {
  const res = await skill.invoke(intentRequest('AskClaudeIntent', { question: 'cómo invierto una lista en python' }));
  assert.match(speechOf(res), /ANTHROPIC_API_KEY/);
});

test('AskClaudeIntent maneja errores de Claude', async () => {
  process.env.ANTHROPIC_API_KEY = 'test';
  claude.askClaude = async () => {
    throw new Error('timeout');
  };
  const res = await skill.invoke(intentRequest('AskClaudeIntent', { question: 'algo' }));
  assert.match(speechOf(res), /No pude obtener respuesta/);
});

test('BaseConversionIntent convierte a hexadecimal', async () => {
  const res = await skill.invoke(intentRequest('BaseConversionIntent', { number: '255', base: { value: 'hexadecimal', id: 'HEXADECIMAL' } }));
  assert.match(speechOf(res), /<say-as interpret-as="spell-out">FF<\/say-as>/);
  assert.equal(res.response.card.content, 'FF');
});

test('GenerateIntent crea un UUID v4', async () => {
  const res = await skill.invoke(intentRequest('GenerateIntent', { thing: { value: 'uuid', id: 'UUID' } }));
  assert.match(res.response.card.content, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('GenerateIntent no dice la contraseña en voz alta', async () => {
  const res = await skill.invoke(intentRequest('GenerateIntent', { thing: { value: 'contraseña', id: 'PASSWORD' } }));
  const password = res.response.card.content;
  assert.equal(password.length, 24);
  assert.ok(!speechOf(res).includes(password));
});

test('PomodoroIntent pide permiso de temporizadores si no lo tiene', async () => {
  const res = await skill.invoke(intentRequest('PomodoroIntent', {}));
  const [directive] = res.response.directives;
  assert.equal(directive.type, 'Connections.SendRequest');
  assert.equal(directive.payload.permissionScope, 'alexa::alerts:timers:skill:readwrite');
  assert.equal(directive.token, 'pomodoro:25');
});

test('PomodoroIntent crea el temporizador con permiso', async () => {
  const permissions = { scopes: { 'alexa::alerts:timers:skill:readwrite': { status: 'GRANTED' } } };
  const res = await skill.invoke(intentRequest('PomodoroIntent', { minutes: '10' }, { permissions }));
  const call = apiCalls.find((c) => c.url.endsWith('/v1/alerts/timers'));
  assert.ok(call, 'llama a la Timers API');
  assert.equal(JSON.parse(call.body).duration, 'PT10M');
  assert.match(speechOf(res), /10 minutos/);
});

test('Connections.Response aceptado inicia el pomodoro con los minutos del token', async () => {
  const res = await skill.invoke(envelope({
    type: 'Connections.Response',
    name: 'AskFor',
    status: { code: '200', message: 'OK' },
    token: 'pomodoro:15',
    payload: { permissionScope: 'alexa::alerts:timers:skill:readwrite', status: 'ACCEPTED' },
  }));
  const call = apiCalls.find((c) => c.url.endsWith('/v1/alerts/timers'));
  assert.equal(JSON.parse(call.body).duration, 'PT15M');
  assert.match(speechOf(res), /15 minutos/);
});

test('Connections.Response denegado avisa al usuario', async () => {
  const res = await skill.invoke(envelope({
    type: 'Connections.Response',
    name: 'AskFor',
    token: 'pomodoro:25',
    payload: { status: 'DENIED' },
  }));
  assert.match(speechOf(res), /Sin el permiso/);
});

test('Modo patito avanza con cualquier explicación y termina al final', async () => {
  let res = await skill.invoke(intentRequest('RubberDuckIntent'));
  assert.equal(res.sessionAttributes.duckStep, 0);

  res = await skill.invoke(intentRequest('AMAZON.FallbackIntent', {}, { sessionAttributes: res.sessionAttributes }));
  assert.equal(res.sessionAttributes.duckStep, 1);
  assert.ok(speechOf(res).includes(QUESTIONS[1].slice(0, 20)));

  res = await skill.invoke(intentRequest('AMAZON.NextIntent', {}, { sessionAttributes: { duckStep: QUESTIONS.length - 1 } }));
  assert.equal(res.response.shouldEndSession, true);
  assert.match(speechOf(res), /Suerte/);
});

test('FallbackIntent fuera del modo patito explica qué puede hacer', async () => {
  const res = await skill.invoke(intentRequest('AMAZON.FallbackIntent'));
  assert.match(speechOf(res), /No entendí/);
});

test('RepoStatusIntent resume issues, PRs y último commit', async () => {
  global.fetch = async (url) => {
    const body = url.includes('/pulls')
      ? [{}, {}]
      : url.includes('/commits')
        ? [{ commit: { message: 'Arregla el login\n\ndetalle', author: { name: 'Oscar', date: new Date(Date.now() - 2 * 86400000).toISOString() } } }]
        : { full_name: 'yo/repo', name: 'repo', open_issues_count: 5, default_branch: 'main' };
    return { ok: true, status: 200, json: async () => body };
  };
  const res = await skill.invoke(intentRequest('RepoStatusIntent'));
  assert.match(speechOf(res), /3 issues abiertos y 2 pull requests abiertos/);
  assert.match(speechOf(res), /anteayer|hace 2 días/);
  assert.match(speechOf(res), /Arregla el login/);
});

test('RepoStatusIntent maneja un repo inexistente', async () => {
  global.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
  const res = await skill.invoke(intentRequest('RepoStatusIntent'));
  assert.match(speechOf(res), /No encontré el repositorio/);
});

test('Cada intent del modelo tiene un handler (ninguno cae en el ErrorHandler)', async () => {
  global.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
  const { intents } = buildModel().interactionModel.languageModel;
  for (const { name } of intents) {
    const res = await skill.invoke(intentRequest(name));
    assert.ok(!speechOf(res).includes('algo falló de mi lado'), `${name} no tiene handler`);
  }
});

test('toSpeakable quita Markdown y bloques de código', () => {
  assert.equal(claude.toSpeakable('Usa **`map`**:\n```js\nx.map(f)\n```\nListo.'), 'Usa map: Listo.');
});

test('El modelo de interacción versionado está al día con lambda/data (npm run build:model)', () => {
  const fs = require('fs');
  const path = require('path');
  const { LOCALES } = require('../../scripts/build-model');
  const expected = buildModel();
  for (const locale of LOCALES) {
    const file = path.join(__dirname, '..', '..', 'skill-package', 'interactionModels', 'custom', `${locale}.json`);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), expected, `${locale}.json está desactualizado`);
  }
});
