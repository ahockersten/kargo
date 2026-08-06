import { describe, expect, test } from 'vitest';

import { Chart, ChartDiscoveryResult, GitCommit, Image } from '@ui/gen/api/v2/models';

import { DiscoveryResult } from './types';
import { getSubscriptionKey, getSubscriptionKeyFreight } from './unique-subscription-key';

const OCI_REPO = 'oci://ghcr.io/external-secrets/charts/external-secrets';
const HTTP_REPO = 'https://charts.external-secrets.io';

describe('getSubscriptionKey / getSubscriptionKeyFreight agreement', () => {
  test('OCI chart subscription: discovered result and Freight artifact yield the same key', () => {
    // A chart in an OCI registry is addressed by repository URL alone, so
    // neither the discovery result nor the Freight artifact carries a name.
    const discovered: ChartDiscoveryResult = { repoURL: OCI_REPO, versions: ['2.8.0'] };
    const fromFreight: Chart = { repoURL: OCI_REPO, version: '0.18.0' };

    expect(getSubscriptionKeyFreight(fromFreight)).toBe(getSubscriptionKey(discovered));
    expect(getSubscriptionKeyFreight(fromFreight)).not.toContain('undefined');
  });

  test('OCI chart subscription: an explicitly empty name is treated as no name', () => {
    const discovered: ChartDiscoveryResult = { repoURL: OCI_REPO, name: '', versions: ['2.8.0'] };
    const fromFreight: Chart = { repoURL: OCI_REPO, name: '', version: '2.8.0' };

    expect(getSubscriptionKey(discovered)).toBe(OCI_REPO);
    expect(getSubscriptionKeyFreight(fromFreight)).toBe(OCI_REPO);
  });

  test('classic HTTP chart subscription: the chart name remains part of the key', () => {
    const discovered: ChartDiscoveryResult = {
      repoURL: HTTP_REPO,
      name: 'external-secrets',
      versions: ['0.18.0']
    };
    const fromFreight: Chart = {
      repoURL: HTTP_REPO,
      name: 'external-secrets',
      version: '0.18.0'
    };

    expect(getSubscriptionKey(discovered)).toBe(`${HTTP_REPO}/external-secrets`);
    expect(getSubscriptionKeyFreight(fromFreight)).toBe(`${HTTP_REPO}/external-secrets`);
  });

  test('two differently named charts in one classic repo still get distinct keys', () => {
    const a: Chart = { repoURL: HTTP_REPO, name: 'chart-a', version: '1.0.0' };
    const b: Chart = { repoURL: HTTP_REPO, name: 'chart-b', version: '1.0.0' };

    expect(getSubscriptionKeyFreight(a)).not.toBe(getSubscriptionKeyFreight(b));
  });

  test('images and git commits are keyed by repository URL alone', () => {
    const image: Image = { repoURL: 'ghcr.io/acme/guestbook', tag: 'v0.0.87', digest: 'sha256:ab' };
    const commit: GitCommit = { repoURL: 'https://github.com/acme/guestbook', id: 'a1f3e2c0' };

    expect(getSubscriptionKeyFreight(image)).toBe('ghcr.io/acme/guestbook');
    expect(getSubscriptionKeyFreight(commit)).toBe('https://github.com/acme/guestbook');
  });

  test('generic subscriptions are keyed by subscription name', () => {
    const generic = {
      name: 'my-subscription',
      artifactReferences: []
    } as unknown as DiscoveryResult;

    expect(getSubscriptionKey(generic)).toBe('my-subscription');
  });
});
