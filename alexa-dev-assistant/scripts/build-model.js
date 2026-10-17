#!/usr/bin/env node
'use strict';

// Genera skill-package/interactionModels/custom/<locale>.json.
// Los slot types GIT_TASK y DEV_CONCEPT salen de lambda/data, así el modelo y el código nunca se desincronizan.
// Uso: node scripts/build-model.js   (o `npm run build:model` desde lambda/)

const fs = require('fs');
const path = require('path');
const gitCommands = require('../lambda/data/gitCommands');
const concepts = require('../lambda/data/concepts');

const LOCALES = ['es-MX', 'es-US'];
const INVOCATION_NAME = 'asistente de código';

function typeFromEntries(name, entries) {
  return {
    name,
    values: entries.map(({ id, synonyms: [value, ...synonyms] }) => ({ id, name: { value, synonyms } })),
  };
}

function intent(name, samples, slots = []) {
  return { name, slots, samples };
}

const intents = [
  intent('AMAZON.CancelIntent', []),
  intent('AMAZON.HelpIntent', []),
  intent('AMAZON.StopIntent', []),
  intent('AMAZON.NavigateHomeIntent', []),
  intent('AMAZON.FallbackIntent', []),
  intent('AMAZON.YesIntent', []),
  intent('AMAZON.NoIntent', []),
  intent('AMAZON.NextIntent', ['listo', 'ya terminé', 'continúa', 'sigue', 'siguiente pregunta']),
  intent('HttpStatusIntent', [
    'qué significa el código {code}',
    'qué significa el error {code}',
    'qué es el código {code}',
    'qué es el error {code}',
    'qué significa un {code}',
    'explícame el código {code}',
    'código http {code}',
    'el servidor me regresa {code}',
    'me sale un error {code}',
  ], [{ name: 'code', type: 'AMAZON.NUMBER' }]),
  intent('GitCommandIntent', [
    'cómo {task} en git',
    'cómo {task}',
    'cómo puedo {task}',
    'cómo se hace para {task}',
    'comando de git para {task}',
    'comando para {task}',
    'en git cómo {task}',
    'qué comando uso para {task}',
    'quiero {task}',
  ], [{ name: 'task', type: 'GIT_TASK' }]),
  intent('ConceptIntent', [
    'qué es {concept}',
    'qué son {concept}',
    'qué significa {concept}',
    'explícame {concept}',
    'explica {concept}',
    'háblame de {concept}',
    'define {concept}',
  ], [{ name: 'concept', type: 'DEV_CONCEPT' }]),
  intent('TipIntent', [
    'dame un consejo',
    'dame un tip',
    'dime un consejo',
    'un consejo de programación',
    'dame un tip de programación',
    'algún consejo',
  ]),
  intent('BaseConversionIntent', [
    'convierte {number} a {base}',
    'convierte el número {number} a {base}',
    'pasa {number} a {base}',
    'cuánto es {number} en {base}',
    '{number} en {base}',
  ], [{ name: 'number', type: 'AMAZON.NUMBER' }, { name: 'base', type: 'NUMBER_BASE' }]),
  intent('GenerateIntent', [
    'genera un {thing}',
    'genera una {thing}',
    'generar {thing}',
    'dame un {thing}',
    'dame una {thing}',
    'necesito un {thing}',
    'necesito una {thing}',
    'crea un {thing}',
    'crea una {thing}',
  ], [{ name: 'thing', type: 'GENERATABLE' }]),
  intent('PomodoroIntent', [
    'inicia un pomodoro',
    'empieza un pomodoro',
    'pomodoro',
    'modo enfoque',
    'inicia un pomodoro de {minutes} minutos',
    'pon un pomodoro de {minutes} minutos',
    'modo enfoque de {minutes} minutos',
    'quiero concentrarme {minutes} minutos',
  ], [{ name: 'minutes', type: 'AMAZON.NUMBER' }]),
  intent('RubberDuckIntent', [
    'modo patito',
    'activa el modo patito',
    'patito de hule',
    'quiero depurar con el patito',
    'ayúdame a depurar',
    'tengo un bug',
    'no encuentro el error',
  ]),
  intent('DuckFoundIntent', [
    'lo encontré',
    'ya lo encontré',
    'ya encontré el error',
    'encontré el bug',
    'ya lo resolví',
    'ya quedó',
  ]),
  intent('RepoStatusIntent', [
    'cómo va mi repositorio',
    'cómo va mi repo',
    'estado de mi repositorio',
    'estado del repo',
    'resumen de mi repositorio',
    'cuántos issues tengo',
    'cuántos pull requests tengo abiertos',
    'qué hay de nuevo en mi repositorio',
  ]),
  intent('AskClaudeIntent', [
    'pregunta {question}',
    'pregúntale {question}',
    'pregunta a claude {question}',
    'dile a claude {question}',
    'tengo una pregunta {question}',
    'tengo una duda {question}',
    'consulta {question}',
  ], [{ name: 'question', type: 'AMAZON.SearchQuery' }]),
];

const types = [
  typeFromEntries('GIT_TASK', gitCommands),
  typeFromEntries('DEV_CONCEPT', concepts),
  typeFromEntries('NUMBER_BASE', [
    { id: 'BINARY', synonyms: ['binario', 'base dos', 'binary'] },
    { id: 'OCTAL', synonyms: ['octal', 'base ocho'] },
    { id: 'DECIMAL', synonyms: ['decimal', 'base diez'] },
    { id: 'HEXADECIMAL', synonyms: ['hexadecimal', 'hex', 'base dieciséis'] },
  ]),
  typeFromEntries('GENERATABLE', [
    { id: 'UUID', synonyms: ['uuid', 'u u i d', 'guid', 'identificador único', 'id único'] },
    { id: 'PASSWORD', synonyms: ['contraseña', 'contraseña segura', 'password', 'clave segura'] },
    { id: 'PORT', synonyms: ['puerto', 'número de puerto', 'puerto libre', 'puerto aleatorio'] },
  ]),
];

function buildModel() {
  return { interactionModel: { languageModel: { invocationName: INVOCATION_NAME, intents, types } } };
}

if (require.main === module) {
  const outDir = path.join(__dirname, '..', 'skill-package', 'interactionModels', 'custom');
  const json = `${JSON.stringify(buildModel(), null, 2)}\n`;
  for (const locale of LOCALES) {
    fs.writeFileSync(path.join(outDir, `${locale}.json`), json);
    console.log(`Modelo escrito: ${locale}.json`);
  }
}

module.exports = { buildModel, LOCALES };
