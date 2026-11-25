import { describe, expect, it } from 'vitest';

import { planDeploy, readTarget } from './deploy.ts';

const target = { bucket: 'my-bucket', distributionId: 'E123' };

describe('readTarget', () => {
  it('reads the deploy contract from the environment', () => {
    expect(readTarget({ CLOUDFRONT_DISTRIBUTION_ID: 'E123', DEPLOY_BUCKET: 'my-bucket' })).toEqual(
      target,
    );
  });

  it('names every missing variable', () => {
    expect(() => readTarget({})).toThrow(
      'Missing environment variables: DEPLOY_BUCKET, CLOUDFRONT_DISTRIBUTION_ID',
    );
  });
});

describe('planDeploy', () => {
  const commands = planDeploy(target).map((command) => command.join(' '));

  it('uploads immutable assets before index.html and never deletes old assets', () => {
    expect(commands[0]).toBe(
      'aws s3 sync dist/assets s3://my-bucket/assets --cache-control public,max-age=31536000,immutable',
    );
    expect(commands[1]).toBe(
      'aws s3 sync dist s3://my-bucket --exclude assets/* --delete --cache-control no-cache',
    );
  });

  it('invalidates only index.html', () => {
    expect(commands[2]).toBe(
      'aws cloudfront create-invalidation --distribution-id E123 --paths /index.html',
    );
  });

  it('changes nothing on a dry run', () => {
    const dry = planDeploy(target, true);
    expect(dry).toHaveLength(2);
    expect(dry.every((command) => command.includes('--dryrun'))).toBe(true);
  });
});
