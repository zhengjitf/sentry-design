import { Integration } from '@sentry/types';

export function collectIntegrations({
  defaultIntegrations = [],
  discoveredIntegrations = [],
  userIntegrations = [],
}: {
  defaultIntegrations?: Integration[];
  discoveredIntegrations?: Integration[];
  userIntegrations?: Integration[] | ((integrations: Integration[]) => Integration[]);
}): Integration[] {
  // Filter out default integrations that are also discovered
  let integrations: Integration[] = [
    ...defaultIntegrations.filter(defaultIntegration =>
      discoveredIntegrations.every(discoveredIntegration => discoveredIntegration.name !== defaultIntegration.name),
    ),
    ...discoveredIntegrations,
  ];

  if (Array.isArray(userIntegrations)) {
    // Filter out integrations that are also included in user options
    integrations = [
      ...integrations.filter(integrations =>
        userIntegrations.every(userIntegration => userIntegration.name !== integrations.name),
      ),
      // And filter out duplicated user options integrations
      ...userIntegrations.reduce((acc, userIntegration) => {
        if (acc.every(accIntegration => userIntegration.name !== accIntegration.name)) {
          acc.push(userIntegration);
        }
        return acc;
      }, [] as Integration[]),
    ];
  } else if (typeof userIntegrations === 'function') {
    integrations = userIntegrations(integrations);
    integrations = Array.isArray(integrations) ? integrations : [integrations];
  }

  return integrations;
}
