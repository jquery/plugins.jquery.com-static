const fs = require('fs')
const path = require('path')
const wikis = require('../json/wiki.json')

const excludePages = ['TitleIndex', 'RecentChanges']

// Keep the latest versions of each page for the archive.
// Drop version history. The timelines won't work without the database.
// And query strings don't work without a server or JS.
// This repo still has the version history, so it's not lost.
const newWikis = wikis.reduce((all, currentWiki) => {
  if (excludePages.includes(currentWiki.name)) return all
  const existingWiki = all.find((wiki) => wiki.name === currentWiki.name)
  if (existingWiki) {
    if (currentWiki.version > existingWiki.version) {
      return all
        .filter((wiki) => wiki.name !== currentWiki.name)
        .concat(currentWiki)
    }
    return all
  }
  return all.concat(currentWiki)
}, [])

// Modify wiki text
newWikis.forEach((wiki) => {
  wiki.text = wiki.text
    // Replace escaped quotes with real quotes
    .replace(/\\"/g, '"')
})

fs.promises
  .writeFile(
    path.join(__dirname, 'wiki.json'),
    JSON.stringify(newWikis, null, 2)
  )
  .catch((err) => console.error(err))
