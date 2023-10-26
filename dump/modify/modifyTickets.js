const fs = require('fs')
const path = require('path')
const tickets = require('../json/ticket.json')
const changes = require('./changes.json')

const newTickets = tickets.map((ticket) => {
  ticket.changes = changes
    .filter((change) => change.ticket === ticket.id)
    .sort((a, b) => a.time - b.time)
    .map((change) => {
      for (const field of change.fields) {
        if (field.field === 'status' && field.newvalue === 'closed') {
          ticket.closedtime = change.time
        }
      }
      delete change.ticket
      return change
    })
  for (const key in ticket) {
    if (ticket[key] === '""' || ticket[key] == null) {
      ticket[key] = ''
    }
    // Replace escaped quotes with real quotes
    if (typeof ticket[key] === 'string') {
      ticket[key] = ticket[key].replace(/\\"/g, '"')
    }
  }
  return ticket
})

fs.promises
  .writeFile(
    path.join(__dirname, 'tickets.json'),
    JSON.stringify(newTickets, null, 2)
  )
  .catch((err) => console.error(err))
