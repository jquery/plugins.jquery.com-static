/**
 * Run buildWatchers.js to generate watchers.json
 */
import { groupBy, uniqBy } from 'lodash-es'
import { readJSON, writeJSON } from './fsJSON.js'

const rplus = /\+/g
const rduplicate = /-\d+$/

// Wordpress removed the plus signs from any version numbers.
// Match by comparing without plus signs to get them back.
function matchVersion(versions, postName) {
  return (
    versions.find(
      (v) => v.replace(rplus, '') === postName.replace(rduplicate, '')
    ) || postName
  )
}

async function constructPlugins() {
  const posts = await readJSON('../json/posts.json')
  const postmeta = await readJSON('../json/postmeta.json')
  let watchers = {}
  try {
    // Get watchers if available
    watchers = await readJSON('../../_data/watchers.json')
  } catch (e) {}

  // "0" key means no parent, i.e. top-level plugin post
  const postsByParent = groupBy(posts, 'post_parent')

  const tags = []
  const plugins = uniqBy(
    postsByParent['0']
      // Filter out posts without a post_name.
      // The "appstore" plugin doesn't have a name
      // in one post, but it does in subsequent posts.
      .filter((post) => !!post.post_name)
      // Sort plugins by watchers count
      .sort((a, b) => {
        const aWatchers = parseInt((watchers[a.ID + ''] || {}).watchers) || 0
        const bWatchers = parseInt((watchers[b.ID + ''] || {}).watchers) || 0
        return bWatchers - aWatchers
      }),
    // Filter out duplicate post_names
    // after sorting by watchers count
    (post) => post.post_name
  ).map((post) => {
    const pluginMeta = postmeta.filter((meta) => meta.post_id === post.ID)
    const metadata = pluginMeta.reduce((acc, meta) => {
      const value = meta.meta_value
      acc[meta.meta_key] =
        value.startsWith('{') || value.startsWith('[')
          ? JSON.parse(meta.meta_value.replace(/(?<!\\)\\"/g, '"'))
          : value.replace('http:', 'https:')
      return acc
    }, {})
    const versions = metadata.versions
    const otherPosts = postsByParent[post.ID] || []
    const posts = uniqBy(
      [post]
        .concat(otherPosts)
        .map((p) => ({
          date: p.post_date,
          name: p.post_name,
          version: matchVersion(versions, p.post_name)
        }))
        .filter((p) => p.version !== metadata.manifest.name),
      'name'
    ).sort((a, b) => {
      const aDate = new Date(a.date)
      const bDate = new Date(b.date)
      return aDate > bDate ? -1 : aDate < bDate ? 1 : 0
    })

    if (metadata.latest !== metadata.manifest.version) {
      console.warn(
        `Mismatch between latest version in metadata and manifest for ${post.post_title}`
      )
    }

    const plugin = {
      ...metadata,
      ...(watchers[post.ID + ''] || {}),
      id: post.ID,
      name: post.post_title,
      description: post.post_content,
      url: `/${post.post_name}`,
      date: posts.length ? posts[posts.length - 1].date : post.post_date,
      posts
    }

    if (metadata.manifest.keywords && metadata.manifest.keywords.length) {
      metadata.manifest.keywords.forEach((keyword) => {
        const lkeyword = keyword.toLowerCase()
        const tag = tags.find((tag) => tag.name === lkeyword)
        if (tag) {
          tag.count++
          const lastPage = tag.pages[tag.pages.length - 1]
          if (lastPage.length < 10) {
            lastPage.push(plugin)
          } else {
            tag.pages.push([plugin])
          }
          return
        }
        tags.push({
          count: 1,
          name: lkeyword,
          pages: [[plugin]]
        })
      })
    }

    return plugin
  })

  console.log(`Found ${plugins.length} plugins`)
  console.log(`Found ${tags.length} tags`)
  tags
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .forEach((tag) => console.log(`${tag.name} (${tag.count})`))

  await Promise.all([
    writeJSON('../../_data/plugins.json', plugins),
    writeJSON('../../_data/pluginTags.json', tags)
  ])

  console.log('Done')
}

constructPlugins()
