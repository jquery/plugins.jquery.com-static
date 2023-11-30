/**
 * This is a heavy task that requires a GitHub token (set in .env)
 * plugins.json is expected at ../../_data/plugins.json
 * Runs one graphql query of 50 batched plugins per second,
 * which is throttled to avoid hitting the GitHub rate limits.
 */
import 'dotenv/config'
import { readJSON, writeJSON } from './fsJSON.js'

const CONCURRENCY_LIMITS = 50

async function logRateLimit() {
  const response = await fetch('https://api.github.com/rate_limit', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  if (!response.ok) {
    console.error(`Error fetching rate limit. Status: ${response.status}`)
    return
  }
  const { resources } = await response.json()
  console.log(
    `Rate limit: ${
      resources.graphql.remaining
    } requests remaining until ${new Date(resources.graphql.reset * 1000)}`
  )
}

function constructPluginQuery(plugin) {
  const [owner, name] = plugin.repo_url
    .replace(/https?:\/\/github.com\//, '')
    .split('/')
  if (!owner || !name) {
    throw new Error(`Invalid repo URL: ${plugin.repo_url}`)
  }
  return `
  plugin${plugin.id}: repository(owner: "${owner}", name: "${name}") {
    forks {
      totalCount
    }
    stargazerCount
  }`
}

async function updateAllPlugins() {
  console.log('Updating watchers for plugins...')
  const plugins = await readJSON('../../_data/plugins.json')

  // Do certain number of requests at a time
  // Limit number of requests per minute
  const fullData = {}
  const promises = []

  const len = plugins.length
  for (let i = 0; i < len; i += CONCURRENCY_LIMITS) {
    const query = `query {${plugins
      .slice(i, i + CONCURRENCY_LIMITS)
      .map(constructPluginQuery)
      .join('')}\n}`

    promises.push(
      fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({ query })
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`[${response.status}]: ${response.statusText}`)
          }
          return response.json()
        })
        .then(({ data, errors = [] }) => {
          Object.assign(fullData, data)
          const badErrors = errors.filter((error) => error.type !== 'NOT_FOUND')
          if (badErrors.length) {
            console.error(badErrors)
            throw new Error('Error fetching plugins')
          }
        })
    )
  }

  console.log(`Running ${promises.length} requests for ${len} plugins...`)
  await Promise.all(promises)

  // Add the watchers and forks to the plugins
  const watchers = {}
  for (const plugin of plugins) {
    const { forks, stargazerCount } = fullData[`plugin${plugin.id}`] || {
      forks: { totalCount: 0 },
      stargazerCount: 0
    }
    watchers[plugin.id] = { forks: forks.totalCount, watchers: stargazerCount }
  }

  // Write watchers to file
  await writeJSON('../../_data/watchers.json', watchers)

  // Log the rate limit
  await logRateLimit()
}

updateAllPlugins()
