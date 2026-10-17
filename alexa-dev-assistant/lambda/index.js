'use strict';

require('./lib/env').loadDotEnv();

const Alexa = require('ask-sdk-core');
const core = require('./handlers/core');
const reference = require('./handlers/reference');
const duck = require('./handlers/duck');
const pomodoro = require('./handlers/pomodoro');
const github = require('./handlers/github');
const claude = require('./handlers/claude');

// El orden importa: el primer handler cuyo canHandle devuelva true gana.
// DuckNextHandler va antes que Fallback para capturar las explicaciones en modo patito.
const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    core.LaunchRequestHandler,
    duck.DuckNextHandler,
    duck.RubberDuckIntentHandler,
    duck.DuckFoundIntentHandler,
    reference.HttpStatusIntentHandler,
    reference.GitCommandIntentHandler,
    reference.ConceptIntentHandler,
    reference.TipIntentHandler,
    reference.BaseConversionIntentHandler,
    reference.GenerateIntentHandler,
    pomodoro.PomodoroIntentHandler,
    pomodoro.PermissionResponseHandler,
    github.RepoStatusIntentHandler,
    claude.AskClaudeIntentHandler,
    core.HelpIntentHandler,
    core.CancelAndStopIntentHandler,
    core.FallbackIntentHandler,
    core.SessionEndedRequestHandler,
  )
  .addErrorHandlers(core.ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .withCustomUserAgent('alexa-dev-assistant/1.0');

exports.skill = skill.create();
exports.handler = skill.lambda();
