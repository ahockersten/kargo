import { Chart, GitCommit, Image } from '@ui/gen/api/v2/models';

import { isArtifactChart } from './artifact-type-guards';
import { DiscoveryResult } from './types';

// Helm charts are the only artifact type identified by a repository URL *and* a
// chart name, and that name is empty for OCI subscriptions, where the chart is
// addressed by repository URL alone. Both key builders below must agree on how
// a nameless chart is rendered, otherwise a key derived from a DiscoveryResult
// never matches the key derived from the equivalent Freight artifact.
const chartSubscriptionKey = (repoURL?: string, name?: string) =>
  name ? `${repoURL}/${name}` : repoURL || '';

export const getSubscriptionKey = (res: DiscoveryResult) => {
  if ('artifactReferences' in res) {
    return res.name || '';
  }

  if ('name' in res && 'repoURL' in res) {
    return chartSubscriptionKey(res.repoURL, res.name);
  }

  if ('repoURL' in res) {
    return res.repoURL || '';
  }

  return '';
};

export const getSubscriptionKeyFreight = (res: Image | Chart | GitCommit) => {
  if (isArtifactChart(res)) {
    return chartSubscriptionKey(res.repoURL, res.name);
  }

  return res.repoURL;
};

export const isEqualSubscriptions = (a: DiscoveryResult, b: DiscoveryResult) =>
  getSubscriptionKey(a) === getSubscriptionKey(b);
