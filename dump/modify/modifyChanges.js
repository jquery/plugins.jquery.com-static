const fs = require('fs')
const path = require('path')
const changes = require('../json/ticket_change.json')

const ticketChanges = []
changes.forEach((change) => {
  for (const key in change) {
    if (change[key] === '""' || change[key] == null) {
      change[key] = ''
    }
    // Replace escaped quotes with real quotes
    if (typeof change[key] === 'string') {
      change[key] = change[key].replace(/\\"/g, '"')
    }
  }
  if (change.oldvalue !== change.newvalue) {
    const prevChange = ticketChanges[ticketChanges.length - 1]
    if (prevChange && prevChange.time === change.time) {
      prevChange.fields.push({
        field: change.field,
        oldvalue: change.oldvalue,
        newvalue: change.newvalue
      })
    } else {
      ticketChanges.push({
        ticket: change.ticket,
        time: change.time,
        author: change.author,
        fields: [
          {
            field: change.field,
            oldvalue: change.oldvalue,
            newvalue: change.newvalue
          }
        ]
      })
    }
  }
})

fs.promises
  .writeFile(
    path.join(__dirname, 'changes.json'),
    JSON.stringify(ticketChanges, null, 2)
  )
  .catch((err) => console.error(err))
