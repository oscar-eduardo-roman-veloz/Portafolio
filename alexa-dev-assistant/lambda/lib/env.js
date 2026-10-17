'use strict';

const fs = require('fs');
const path = require('path');

// Las skills Alexa-hosted no permiten definir variables de entorno desde la consola,
// así que también leemos un archivo lambda/.env (ignorado por git) si existe.
// Las variables ya definidas en el entorno (p. ej. en AWS Lambda) tienen prioridad.
function loadDotEnv(file = path.join(__dirname, '..', '.env')) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2');
  }
}

module.exports = { loadDotEnv };
