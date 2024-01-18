import { expect } from '@playwright/test';
import type { Event } from '@sentry/types';

import { sentryTest } from '../../../../utils/fixtures';
import { getFirstSentryEnvelopeRequest, shouldSkipTracingTest } from '../../../../utils/helpers';

sentryTest('should add browser-related spans to pageload transaction', async ({ getLocalTestPath, page }) => {
  if (shouldSkipTracingTest()) {
    sentryTest.skip();
  }

  const url = await getLocalTestPath({ testDir: __dirname });

  const eventData = await getFirstSentryEnvelopeRequest<Event>(page, url);
  // eslint-disable-next-line deprecation/deprecation
  const browserSpans = eventData.spans?.filter(({ op }) => op === 'browser');

  // Spans `connect`, `cache` and `DNS` are not always inside `pageload` transaction.
  expect(browserSpans?.length).toBeGreaterThanOrEqual(4);

  ['domContentLoadedEvent', 'loadEvent', 'request', 'response'].forEach(eventDesc =>
    expect(browserSpans).toContainEqual(
      expect.objectContaining({
        description: eventDesc,
        parent_span_id: eventData.contexts?.trace?.span_id,
      }),
    ),
  );
});
