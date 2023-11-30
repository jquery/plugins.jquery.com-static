/**
 * Run buildWatchers.js to generate watchers.json
 */
import { groupBy } from 'lodash-es'
import { readJSON, writeJSON } from './fsJSON.js'

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
  const plugins = postsByParent['0']
    // Sort plugins by watchers count
    .sort((a, b) => {
      const aWatchers = parseInt((watchers[a.ID + ''] || {}).watchers) || 0
      const bWatchers = parseInt((watchers[b.ID + ''] || {}).watchers) || 0
      return bWatchers - aWatchers
    })
    .map((post) => {
      const pluginMeta = postmeta.filter((meta) => meta.post_id === post.ID)
      const metadata = pluginMeta.reduce((acc, meta) => {
        const value = meta.meta_value
        acc[meta.meta_key] =
          value.startsWith('{') || value.startsWith('[')
            ? JSON.parse(meta.meta_value.replace(/(?<!\\)\\"/g, '"'))
            : value.replace('http:', 'https:')
        return acc
      }, {})
      const otherPosts = postsByParent[post.ID] || []
      const posts = [post].concat(otherPosts).map((otherPost) => ({
        date: otherPost.post_date,
        version: otherPost.post_name
      }))
      posts.sort((a, b) => {
        const aDate = new Date(a)
        const bDate = new Date(b)
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
        date: posts[posts.length - 1].date,
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
