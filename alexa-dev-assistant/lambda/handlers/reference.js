'use strict';

const crypto = require('crypto');
const Alexa = require('ask-sdk-core');
const httpCodes = require('../data/httpCodes');
const gitCommands = require('../data/gitCommands');
const concepts = require('../data/concepts');
const tips = require('../data/tips');
const claude = require('../lib/claude');
const { escapeSsml, pick, findEntry, getResolvedSlotId, isIntent, answer } = require('../lib/speech');
const { answerWithClaude } = require('./claude');

const HttpStatusIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'HttpStatusIntent'),
  handle(handlerInput) {
    const code = Number(Alexa.getSlotValue(handlerInput.requestEnvelope, 'code'));
    const entry = httpCodes[code];
    if (!entry) {
      return answer(handlerInput, {
        speech: Number.isInteger(code)
          ? `No tengo el código ${code} en mi lista. Los que empiezan con 4 son errores del cliente y los que empiezan con 5, errores del servidor.`
          : 'No entendí el código. Dime, por ejemplo: qué significa el código 404.',
      });
    }
    return answer(handlerInput, {
      speech: `El ${code}, ${escapeSsml(entry.name)}, significa que ${escapeSsml(entry.description)}`,
      cardTitle: `HTTP ${code} ${entry.name}`,
      cardText: entry.description,
    });
  },
};

const GitCommandIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'GitCommandIntent'),
  handle(handlerInput) {
    const { requestEnvelope } = handlerInput;
    const entry = findEntry(gitCommands, requestEnvelope, 'task');
    if (entry) {
      return answer(handlerInput, {
        speech: `${escapeSsml(entry.say)} Te dejé el comando exacto en la app de Alexa.`,
        cardTitle: `Git: ${entry.synonyms[0]}`,
        cardText: entry.cmd,
      });
    }
    const task = Alexa.getSlotValue(requestEnvelope, 'task');
    if (task && claude.isEnabled()) {
      return answerWithClaude(handlerInput, `¿Cómo hago esto en git: ${task}?`, `Git: ${task}`);
    }
    return answer(handlerInput, {
      speech: 'No tengo esa receta de Git. Prueba con: cómo deshago el último commit, o cómo creo una rama.',
    });
  },
};

const ConceptIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'ConceptIntent'),
  handle(handlerInput) {
    const { requestEnvelope } = handlerInput;
    const entry = findEntry(concepts, requestEnvelope, 'concept');
    if (entry) {
      return answer(handlerInput, {
        speech: escapeSsml(entry.text),
        cardTitle: entry.synonyms[0],
        cardText: entry.text,
      });
    }
    const concept = Alexa.getSlotValue(requestEnvelope, 'concept');
    if (concept && claude.isEnabled()) {
      return answerWithClaude(handlerInput, `Explícame qué es ${concept} en programación.`, concept);
    }
    return answer(handlerInput, {
      speech: 'Ese concepto todavía no está en mi glosario. Prueba con: qué es un closure, o explícame Docker.',
    });
  },
};

const TipIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'TipIntent'),
  handle(handlerInput) {
    const tip = pick(tips);
    return answer(handlerInput, { speech: escapeSsml(tip), cardTitle: 'Consejo de programación', cardText: tip });
  },
};

const BASES = {
  BINARY: { radix: 2, label: 'binario', ssml: (v) => `<say-as interpret-as="digits">${v}</say-as>` },
  OCTAL: { radix: 8, label: 'octal', ssml: (v) => `<say-as interpret-as="digits">${v}</say-as>` },
  DECIMAL: { radix: 10, label: 'decimal', ssml: (v) => v },
  HEXADECIMAL: { radix: 16, label: 'hexadecimal', ssml: (v) => `<say-as interpret-as="spell-out">${v}</say-as>` },
};

const BaseConversionIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'BaseConversionIntent'),
  handle(handlerInput) {
    const { requestEnvelope } = handlerInput;
    const number = Number(Alexa.getSlotValue(requestEnvelope, 'number'));
    const base = BASES[getResolvedSlotId(requestEnvelope, 'base')];
    if (!Number.isSafeInteger(number) || number < 0 || !base) {
      return answer(handlerInput, {
        speech: 'Dime un número entero y la base. Por ejemplo: convierte 255 a hexadecimal.',
      });
    }
    const result = number.toString(base.radix).toUpperCase();
    return answer(handlerInput, {
      speech: `${number} en ${base.label} es ${base.ssml(result)}.`,
      cardTitle: `${number} en ${base.label}`,
      cardText: result,
    });
  },
};

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+';

const GENERATORS = {
  UUID: () => ({
    title: 'UUID v4',
    value: crypto.randomUUID(),
    speech: 'Generé un UUID versión 4.',
  }),
  PASSWORD: () => ({
    title: 'Contraseña segura',
    value: Array.from({ length: 24 }, () => PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)]).join(''),
    speech: 'Generé una contraseña de 24 caracteres. Por seguridad no la voy a decir en voz alta.',
  }),
  PORT: () => {
    const port = crypto.randomInt(49152, 65536);
    return {
      title: 'Puerto aleatorio',
      value: String(port),
      speech: `Usa el puerto ${port}. Está en el rango dinámico, así que difícilmente choca con otro servicio.`,
    };
  },
};

const GenerateIntentHandler = {
  canHandle: (handlerInput) => isIntent(handlerInput, 'GenerateIntent'),
  handle(handlerInput) {
    const generator = GENERATORS[getResolvedSlotId(handlerInput.requestEnvelope, 'thing')];
    if (!generator) {
      return answer(handlerInput, { speech: 'Puedo generar un UUID, una contraseña segura o un puerto. ¿Cuál quieres?' });
    }
    const { title, value, speech } = generator();
    return answer(handlerInput, {
      speech: `${speech} Lo encuentras en la app de Alexa.`,
      cardTitle: title,
      cardText: value,
    });
  },
};

module.exports = {
  HttpStatusIntentHandler,
  GitCommandIntentHandler,
  ConceptIntentHandler,
  TipIntentHandler,
  BaseConversionIntentHandler,
  GenerateIntentHandler,
};
