const fs = require('fs')
const path = require('path')
const attachments = require('../json/attachment.json')
const newAttachments = []

attachments
  .filter((attachment) => {
    return fs.existsSync(
      path.join(
        __dirname,
        '../..',
        'raw-attachment/ticket',
        attachment.id,
        attachment.filename
      )
    )
  })
  .forEach((attachment) => {
    for (const key in attachment) {
      if (attachment[key] === '""' || attachment[key] == null) {
        attachment[key] = ''
      }
      // Replace escaped quotes with real quotes
      if (typeof attachment[key] === 'string') {
        attachment[key] = attachment[key].replace(/\\"/g, '"')
      }
      // Make IDs numbers
      if (key === 'id') {
        if (isNaN(attachment[key])) {
          throw new Error(`Attachment ID ${attachment[key]} is not a number`)
        }
        attachment[key] = parseInt(attachment[key])
      }
    }
    newAttachments.push(attachment)
  })

console.log('Original length: ', attachments.length)
console.log('New length: ', newAttachments.length)

fs.promises
  .writeFile(
    path.join(__dirname, 'attachments.json'),
    JSON.stringify(newAttachments, null, 2)
  )
  .catch((err) => console.error(err))
