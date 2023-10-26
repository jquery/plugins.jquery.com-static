const fs = require('fs')
const path = require('path')
const milestones = require('../json/milestone.json')
const tickets = require('../json/ticket.json')

milestones.forEach((milestone) => {
  for (const key in milestone) {
    if (milestone[key] === '""' || milestone[key] == null) {
      milestone[key] = ''
    }
    // Replace escaped quotes with real quotes
    if (typeof milestone[key] === 'string') {
      milestone[key] = milestone[key].replace(/\\"/g, '"')
    }
  }
  const milestoneTickets = tickets.filter(
    (ticket) => ticket.milestone === milestone.name
  )
  milestone.total = milestoneTickets.length
  milestone.closed = milestoneTickets.filter(
    (ticket) => ticket.status === 'closed'
  ).length
  // 0 and 0 should be 100% not 0%
  milestone.percent = milestone.closed === milestone.total ? 100 : Math.round((milestone.closed / milestone.total) * 100) || 0
})

milestones.sort((a, b) => {
  if (!a.completed && b.completed) {
    return 1
  }
  if (a.completed && !b.completed) {
    return -1
  }
  return a.completed - b.completed
})

fs.promises
  .writeFile(
    path.join(__dirname, 'milestones.json'),
    JSON.stringify(milestones, null, 2)
  )
  .catch((err) => console.error(err))
