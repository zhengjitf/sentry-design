import { Integration, Options } from '@sentry/types';

export function getIntegrationsToSetup(options: Options): Integration[] {
  const defaultIntegrations = (options.defaultIntegrations && [...options.defaultIntegrations]) || [];
  const userIntegrations = options.integrations;

  let integrations: Integration[] = [];
  if (Array.isArray(userIntegrations)) {
    const userIntegrationsNames = userIntegrations.map(i => i.name);
    const pickedIntegrationsNames: string[] = [];

    // Leave only unique default integrations, that were not overridden with provided user integrations
    defaultIntegrations.forEach(defaultIntegration => {
      if (
        userIntegrationsNames.indexOf(defaultIntegration.name) === -1 &&
        pickedIntegrationsNames.indexOf(defaultIntegration.name) === -1
      ) {
        integrations.push(defaultIntegration);
        pickedIntegrationsNames.push(defaultIntegration.name);
      }
    });

    // Don't add same user integration twice
    userIntegrations.forEach(userIntegration => {
      if (pickedIntegrationsNames.indexOf(userIntegration.name) === -1) {
        integrations.push(userIntegration);
        pickedIntegrationsNames.push(userIntegration.name);
      }
    });
  } else if (typeof userIntegrations === 'function') {
    integrations = userIntegrations(defaultIntegrations);
    integrations = Array.isArray(integrations) ? integrations : [integrations];
  } else {
    integrations = [...defaultIntegrations];
  }

  return integrations;
}
