/**
 * Deploys the built SPA (dist/) to S3 + CloudFront with the AWS CLI. Provider-agnostic: any CI
 * (GitHub Actions, Azure DevOps…) logs in to AWS with OIDC and runs `pnpm deploy:s3`.
 * It also runs locally with your own AWS session; `pnpm deploy:s3 --dry-run` changes nothing.
 *
 * Contract (environment variables): DEPLOY_BUCKET, CLOUDFRONT_DISTRIBUTION_ID.
 * Region and credentials come from the usual AWS CLI environment.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

type DeployTarget = { bucket: string; distributionId: string };

const REQUIRED = ['DEPLOY_BUCKET', 'CLOUDFRONT_DISTRIBUTION_ID'] as const;

export const readTarget = (env: Record<string, string | undefined>): DeployTarget => {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  return { bucket: env.DEPLOY_BUCKET!, distributionId: env.CLOUDFRONT_DISTRIBUTION_ID! };
};

export const planDeploy = ({ bucket, distributionId }: DeployTarget, dryRun = false) => {
  const dry = dryRun ? ['--dryrun'] : [];
  return [
    // 1. Hashed assets first, cached for a year. Never deleted, so tabs still on the previous
    //    release can load their chunks.
    [
      'aws',
      's3',
      'sync',
      'dist/assets',
      `s3://${bucket}/assets`,
      '--cache-control',
      'public,max-age=31536000,immutable',
      ...dry,
    ],
    // 2. Then index.html and the rest, always revalidated; root files gone from the build are removed.
    [
      'aws',
      's3',
      'sync',
      'dist',
      `s3://${bucket}`,
      '--exclude',
      'assets/*',
      '--delete',
      '--cache-control',
      'no-cache',
      ...dry,
    ],
    // 3. Serve the new index.html right away.
    ...(dryRun
      ? []
      : [
          [
            'aws',
            'cloudfront',
            'create-invalidation',
            '--distribution-id',
            distributionId,
            '--paths',
            '/index.html',
          ],
        ]),
  ];
};

// Run only when executed (`pnpm deploy:s3`), not when imported by the test.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (!existsSync('dist/index.html')) throw new Error('No build found: run `pnpm build` first.');
  const dryRun = process.argv.includes('--dry-run');

  for (const [bin = '', ...args] of planDeploy(readTarget(process.env), dryRun)) {
    console.log(`\n▶ ${[bin, ...args].join(' ')}`);
    const { status } = spawnSync(bin, args, {
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });
    if (status !== 0) {
      process.exitCode = status ?? 1;
      break;
    }
  }
}
