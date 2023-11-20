import fs from 'fs'
import path from 'path'
import url from 'url'

const dirname = url.fileURLToPath(new URL('.', import.meta.url))

const files = [
  {
    filename: 'options',
    columns: {
      option_id: 'number',
      option_name: 'string',
      option_value: 'string',
      autoload: 'string'
    }
  },
  {
    filename: 'postmeta',
    columns: {
      meta_id: 'number',
      post_id: 'number',
      meta_key: 'string',
      meta_value: 'string'
    }
  },
  {
    filename: 'posts',
    columns: {
      ID: 'number',
      post_author: 'number',
      post_date: 'string',
      post_date_gmt: 'string',
      post_content: 'string',
      post_title: 'string',
      post_excerpt: 'string',
      post_status: 'string',
      comment_status: 'string',
      ping_status: 'string',
      post_password: 'string',
      post_name: 'string',
      to_ping: 'string',
      pinged: 'string',
      post_modified: 'number',
      post_modified_gmt: 'number',
      post_content_filtered: 'string',
      post_parent: 'number',
      guid: 'string',
      menu_order: 'number',
      post_type: 'string',
      post_mime_type: 'string',
      comment_count: 'number'
    }
  }
]

files.forEach(async ({ filename, columns }) => {
  const data = await fs.promises.readFile(
    path.join(dirname, '../database/', `${filename}.csv`),
    'utf8'
  )

  // Remove last empty line
  const lines = data.trim().split(/(?<![\\\n])\r?\n/)

  const json = lines.map((line, lineNum) => {
    const values = line.split(',,,,,')
    const obj = {}
    let i = 0
    for (const [key, type] of Object.entries(columns)) {
      const value = values[i++]
      if (value === '\\N') {
        obj[key] = null
      } else if (type === 'number') {
        obj[key] = !Number.isNaN(value) ? Number(value) : null
      } else if (type === 'string') {
        if (!value) {
          console.log(`undefined in ${filename} for ${key} in line ${lineNum}`)
        }
        obj[key] = value ? value.replace(/^"([^]*)"$/, '$1') : ''
      }
    }
    return obj
  })

  await fs.promises.mkdir(path.join(dirname, '../json'), { recursive: true })

  return fs.promises.writeFile(
    path.join(dirname, '../json', `${filename}.json`),
    JSON.stringify(json, null, 2)
  )
})
