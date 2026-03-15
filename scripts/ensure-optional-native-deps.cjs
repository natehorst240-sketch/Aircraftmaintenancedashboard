#!/usr/bin/env node
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execSync, spawnSync } = require('node:child_process')

const CACHE_DIR = path.join(os.homedir(), '.npm', '_cacache')
const projectRoot = path.resolve(__dirname, '..')

const deps = [
  {
    name: '@rollup/rollup-linux-x64-gnu',
    dest: path.join(projectRoot, 'node_modules', '@rollup', 'rollup-linux-x64-gnu'),
    cacheKey:
      'make-fetch-happen:request-cache:https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.59.0.tgz',
  },
  {
    name: 'lightningcss-linux-x64-gnu',
    dest: path.join(projectRoot, 'node_modules', 'lightningcss-linux-x64-gnu'),
    cacheKey:
      'make-fetch-happen:request-cache:https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.30.1.tgz',
  },
  {
    name: '@esbuild/linux-x64',
    dest: path.join(projectRoot, 'node_modules', '@esbuild', 'linux-x64'),
    cacheKey:
      'make-fetch-happen:request-cache:https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.27.3.tgz',
  },
]

function loadCacache() {
  const npmExecPath = process.env.npm_execpath
  if (npmExecPath) {
    const fromExecPath = path.resolve(path.dirname(npmExecPath), '..', 'node_modules', 'cacache')
    if (fs.existsSync(fromExecPath)) {
      return require(fromExecPath)
    }
  }

  const npmGlobalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
  const fromGlobalRoot = path.join(npmGlobalRoot, 'npm', 'node_modules', 'cacache')
  if (fs.existsSync(fromGlobalRoot)) {
    return require(fromGlobalRoot)
  }

  throw new Error('Unable to locate npm cacache module')
}

async function ensureDep(cacache, dep) {
  const marker = path.join(dep.dest, 'package.json')
  if (fs.existsSync(marker)) {
    return false
  }

  fs.mkdirSync(dep.dest, { recursive: true })
  const packed = await cacache.get(CACHE_DIR, dep.cacheKey)
  const tarball = path.join(os.tmpdir(), `${dep.name.replace(/[@/]/g, '_')}.tgz`)
  fs.writeFileSync(tarball, packed.data)

  const result = spawnSync('tar', ['-xzf', tarball, '-C', dep.dest, '--strip-components=1'], {
    stdio: 'inherit',
  })

  fs.rmSync(tarball, { force: true })

  if (result.status !== 0) {
    throw new Error(`Failed extracting ${dep.name}`)
  }

  return true
}

;(async () => {
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    process.exit(0)
  }

  const cacache = loadCacache()

  const installed = []
  for (const dep of deps) {
    try {
      const didInstall = await ensureDep(cacache, dep)
      if (didInstall) installed.push(dep.name)
    } catch (err) {
      console.error(`Missing required cached package: ${dep.name}`)
      console.error('Run npm install in an environment with full npm access, then retry.')
      console.error(err.message)
      process.exit(1)
    }
  }

  if (installed.length > 0) {
    console.log(`Installed cached native packages: ${installed.join(', ')}`)
  }
})()
