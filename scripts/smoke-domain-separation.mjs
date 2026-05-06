import { spawn } from 'node:child_process'
import http from 'node:http'

const port = Number(process.env.SMOKE_PORT ?? 3210)
const nextBin = 'node_modules/next/dist/bin/next'

const server = spawn(process.execPath, [nextBin, 'dev', '-p', String(port), '-H', '127.0.0.1'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
})

let logs = ''
server.stdout.on('data', chunk => {
  logs += chunk.toString()
})
server.stderr.on('data', chunk => {
  logs += chunk.toString()
})

function stopServer() {
  if (!server.killed) server.kill('SIGTERM')
}

process.on('exit', stopServer)
process.on('SIGINT', () => {
  stopServer()
  process.exit(130)
})

async function waitForServer() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30_000) {
    if (server.exitCode !== null) {
      throw new Error(`Next dev server exited early.\n${logs}`)
    }

    try {
      const response = await requestWithHost('internal.sharmaeye.com', '/')
      if (response.status > 0) return
    } catch {
      // Server is not ready yet.
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  throw new Error(`Timed out waiting for Next dev server.\n${logs}`)
}

function requestWithHost(host, path) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
        headers: { Host: host },
      },
      response => {
        response.resume()
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            location: response.headers.location,
          })
        })
      },
    )

    request.on('error', reject)
    request.end()
  })
}

async function assertRoute({ host, path, status, location }) {
  const response = await requestWithHost(host, path)

  if (response.status !== status) {
    throw new Error(`${host}${path}: expected ${status}, got ${response.status}`)
  }

  if (location !== undefined) {
    const actual = response.location
    if (actual !== location) {
      throw new Error(`${host}${path}: expected location ${location}, got ${actual}`)
    }
  }
}

try {
  await waitForServer()

  await assertRoute({
    host: 'sharmaeye.com',
    path: '/dashboard',
    status: 307,
    location: '/',
  })

  await assertRoute({
    host: 'sharmaeye.com',
    path: '/cataract-surgery',
    status: 200,
  })

  await assertRoute({
    host: 'internal.sharmaeye.com',
    path: '/',
    status: 307,
    location: '/login',
  })

  await assertRoute({
    host: 'internal.sharmaeye.com',
    path: '/login',
    status: 200,
  })

  console.log('Domain separation smoke test passed.')
} finally {
  stopServer()
}
