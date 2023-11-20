import fs from 'fs'
import path from 'path'
import url from 'url'
import { groupBy } from 'lodash-es'

const dirname = url.fileURLToPath(new URL('.', import.meta.url))

async function constructPlugins() {
  const posts = JSON.parse(
    await fs.promises.readFile(path.join(dirname, '../json/posts.json'), 'utf8')
  )
  const postmeta = JSON.parse(
    await fs.promises.readFile(
      path.join(dirname, '../json/postmeta.json'),
      'utf8'
    )
  )
  // "0" key means no parent, i.e. top-level plugin post
  const postsByParent = groupBy(posts, 'post_parent')

  const tags = {}
  const plugins = postsByParent['0'].map((post) => {
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
    const postVersions = otherPosts.map((otherPost) => otherPost.post_name)

    if (metadata.latest !== metadata.manifest.version) {
      console.log(
        `Mismatch between latest version in metadata and manifest for ${post.post_title}`
      )
    }

    if (metadata.manifest.keywords && metadata.manifest.keywords.length) {
      metadata.manifest.keywords.forEach((keyword) => {
        if (!tags[keyword]) {
          tags[keyword] = []
        }
        tags[keyword].push(post.ID)
      })
    }

    return {
      ...metadata,
      id: post.ID,
      name: post.post_title,
      description: post.post_content,
      url: `/${post.post_name}`,
      postVersions
    }
  })

  await Promise.all([
    fs.promises.writeFile(
      path.join(dirname, '../../_data/plugins.json'),
      JSON.stringify(plugins, null, 2)
    ),
    fs.promises.writeFile(
      path.join(dirname, '../../_data/tags.json'),
      JSON.stringify(tags, null, 2)
    )
  ])
}

constructPlugins()
