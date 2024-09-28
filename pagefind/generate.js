import fs from 'node:fs/promises'
import * as pagefind from 'pagefind'

// Create a Pagefind search index to work with
const { index } = await pagefind.createIndex()

// Index milestones and tickets
await index.addDirectory({
  path: '_site',
  glob: '**/[!404]*.{html}'
})

// Write pagefind files
const { errors } = await index.writeFiles({
  outputPath: '_site/pagefind'
})

if (errors.length) {
  console.error(errors)
  process.exit(1)
}

// Append init code to pagefind-ui.js
const pagefindUI = await fs.readFile('./_site/pagefind/pagefind-ui.js', 'utf8')
const initCode = await fs.readFile('./pagefind/init.js', 'utf8')
await fs.writeFile(
  './_site/pagefind/pagefind-ui.js',
  `${pagefindUI}\n${initCode}`
)

console.log('Pagefind search index created successfully!')
