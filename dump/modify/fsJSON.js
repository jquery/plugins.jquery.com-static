import fs from 'fs/promises'
import path from 'path'
import url from 'url'

const dirname = url.fileURLToPath(new URL('.', import.meta.url))

export async function readJSON(filepath) {
  return JSON.parse(await fs.readFile(path.join(dirname, filepath), 'utf8'))
}

export async function writeJSON(filepath, contents) {
  return fs.writeFile(
    path.join(dirname, filepath),
    JSON.stringify(contents, null, 2)
  )
}
