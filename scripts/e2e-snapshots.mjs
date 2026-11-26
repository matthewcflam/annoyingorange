/**
 * Regenerates the screenshot baselines (e2e/snapshots.spec.ts), for this
 * machine's platform and for CI's (Linux, in the Playwright Docker image the
 * CI job also runs in, so the pixels match). Needs Docker for the Linux set.
 *
 *   npm run test:e2e:snapshots            both sets
 *   npm run test:e2e:snapshots -- --local this platform only
 *   npm run test:e2e:snapshots -- --linux Linux only
 *
 * Linux node_modules live in a Docker volume (orange-e2e-node-modules), so
 * the Windows ones in the repo are never touched. The container builds into
 * dist/, so rebuild before previewing locally.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const args = new Set(process.argv.slice(2))
const local = !args.has('--linux')
const linux = !args.has('--local')

// npx is a .cmd on Windows and needs a shell; docker is an .exe and must not
// have one (the shell would split the bash -c script).
const run = (cmd, argv) => execFileSync(cmd, argv, { stdio: 'inherit', shell: process.platform === 'win32' && cmd === 'npx' })

if (local && process.platform !== 'linux') {
  console.log(`\n> ${process.platform} baselines`)
  run('npx', ['playwright', 'test', '--grep', '@snapshot', '--update-snapshots'])
}

if (linux) {
  const version = JSON.parse(readFileSync('node_modules/@playwright/test/package.json', 'utf8')).version
  const image = `mcr.microsoft.com/playwright:v${version}-noble`
  console.log(`\n> linux baselines in ${image}`)
  run('docker', [
    'run', '--rm', '--ipc=host',
    '-v', `${process.cwd()}:/work`,
    '-v', 'orange-e2e-node-modules:/work/node_modules',
    '-w', '/work',
    '-e', 'CI=1',
    image,
    'bash', '-c',
    'npm ci --no-audit --no-fund && npm run build && npx playwright test --project=chromium --grep @snapshot --update-snapshots',
  ])
}
