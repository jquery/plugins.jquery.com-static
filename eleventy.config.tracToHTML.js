const rlists = /^\s*([\*-] )/
const rblockquote = /^\s*&gt; /
const rheaders = /^ *(\=+) *([^\n\r]+?)[=\s]*$/

const space = '(^|\\s|\\()'
const quoted = ' "([^"]+)"'
const bracketed = '(?: ([^\\]]+))?'

const urlpart = '[^\\s\\]]+'
const url = `(https?://${urlpart})`
const relativeLink = `(/${urlpart})`
const hashLink = `(#${urlpart})`
const camelCaseLink = `([A-Z][a-z]+[A-Z]\\w+)`
const tracTicketLink = `trac:#(${urlpart})`
const tracLink = `trac:(${urlpart})`
const wikiLink = `wiki:(${urlpart})`
const wikipediaLink = `wikipedia:(${urlpart})`

let listStarted = false
let blockquoteStarted = false

const excludeMacros = ['br', 'tracguidetoc', 'pageoutline']

function escapeHTML(string) {
  return string.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

module.exports = function tracToHTML(text) {
  const codes = []
  const pres = []
  let html = escapeHTML(text)
    // Newlines have extra escapes in the strings
    .replace(/\\\n/g, '\n')
    // Replace `` with <code> tags
    .replace(/`([^\r\n`]+?)`/g, (_match, code) => {
      codes.push(code) // Save the code for later
      return `<code></code>`
    })
    // Replace {{{ }}} with <pre> tags
    .replace(/{{{([^]+?)}}}/g, (_match, code) => {
      // Save the code for later
      pres.push(
        // Remove language hints
        code.replace(/^#!\w+\r?\n/, '')
      )
      return `<pre class="wiki"></pre>`
    })
    // Convert ---- to <hr>
    .replace(/^--+$/gm, '<hr />')
    // Replace three single quotes with <strong>
    .replace(/'''([^']+?)'''/g, '<strong>$1</strong>')
    // Replace two slashses with <em>
    .replace(/(?<!:)\/\/([^\/]+?)\/\//g, '<em>$1</em>')
    // Linkify http links outside brackets
    .replace(new RegExp(`${space}${url}`, 'g'), function (_match, space, url) {
      return `${
        space || ''
      }<a href="${url}" class="ext-link"><span class="icon"></span>${url}</a>`
    })
    // Linkify http links in brackets
    .replace(
      new RegExp(
        `${space}(?:(?:\\[${url}${quoted}\\])|(?:\\[${url}${bracketed}\\]))`,
        'g'
      ),
      function (_match, space, quotedurl, quotedtext, url, text) {
        return `${space || ''}<a href="${
          quotedurl || url
        }" class="ext-link"><span class="icon"></span>${
          quotedtext || text || url
        }</a>`
      }
    )
    // Linkify relative links in brackets
    .replace(
      new RegExp(
        `${space}(?:(?:\\[${relativeLink}${quoted}\\])|(?:\\[${relativeLink}${bracketed}\\]))`,
        'g'
      ),
      function (_match, space, quotedurl, quotedtext, url, text) {
        return `${space || ''}<a href="${
          quotedurl || url
        }" class="ext-link"><span class="icon"></span>${
          quotedtext || text || url
        }</a>`
      }
    )
    // Linkify hash links in brackets
    .replace(
      new RegExp(
        `${space}(?:(?:\\[${hashLink}${quoted}\\])|(?:\\[${hashLink}${bracketed}\\]))`,
        'g'
      ),
      function (_match, space, quotedurl, quotedtext, url, text) {
        return `${space || ''}<a href="${
          quotedurl || url
        }" class="ext-link"><span class="icon"></span>${
          quotedtext || text || url
        }</a>`
      }
    )
    // Linkify CamelCase links in brackets
    .replace(
      new RegExp(
        `${space}(?:(?:\\[${camelCaseLink}${quoted}\\])|(?:\\[${camelCaseLink}${bracketed}\\]))`,
        'g'
      ),
      function (_match, space, quotedpage, quotedtext, page, text) {
        return `${space || ''}<a href="/wiki/${quotedpage || page}">${
          quotedtext || text || page
        }</a>`
      }
    )
    // Linkify trac ticket links
    .replace(
      new RegExp(
        `${space}(?:(?:\\[${tracTicketLink}${quoted}\\])|(?:\\[${tracTicketLink}${bracketed}\\]))`,
        'ig'
      ),
      function (_match, space, quotepage, quotedtext, page, text) {
        return `${space || ''}<a href="https://trac.edgewall.org/ticket/${
          quotepage || page
        }" class="ext-link"><span class="icon"></span>${
          quotedtext || text || page
        }</a>`
      }
    )
    // Linkify trac links
    .replace(
      new RegExp(
        `${space}(?:(?:\\[${tracLink}${quoted}\\])|(?:\\[${tracLink}${bracketed}\\]))`,
        'ig'
      ),
      function (_match, space, quotepage, quotedtext, page, text) {
        return `${space || ''}<a href="https://trac.edgewall.org/intertrac/${
          quotepage || page
        }" class="ext-link"><span class="icon"></span>${
          quotedtext || text || page
        }</a>`
      }
    )
    // Linkify wiki links
    .replace(
      new RegExp(
        `${space}(?:(?:\\[${wikiLink}${quoted}\\])|(?:\\[${wikiLink}${bracketed}\\]))`,
        'ig'
      ),
      function (_match, space, quotepage, quotedtext, page, text) {
        return `${space || ''}<a href="/wiki/${
          quotepage || page
        }" class="ext-link"><span class="icon"></span>${
          quotedtext || text || page
        }</a>`
      }
    )
    // Linkify wikipedia links
    .replace(
      new RegExp(
        `${space}(?:(?:\\[${wikipediaLink}${quoted}\\])|(?:\\[${wikipediaLink}${bracketed}\\]))`,
        'ig'
      ),
      function (_match, space, quotepage, quotedtext, page, text) {
        return `${space || ''}<a href="https://wikipedia.org/wiki/${
          quotepage || page
        }" class="ext-link"><span class="icon"></span>${
          quotedtext || text || page
        }</a>`
      }
    )
    // Linkify ticket references
    .replace(
      new RegExp(`${space}#(\\d+)`, 'g'),
      `$1<a href="/ticket/$2">#$2</a>`
    )
    // Linkify CamelCase to wiki
    .replace(
      new RegExp(`${space}(!)?${camelCaseLink}`, 'g'),
      function (_match, space, excl, page) {
        if (excl) {
          return `${space || ''}${page}`
        }
        return `${space || ''}<a href="/wiki/${page}">${page}</a>`
      }
    )
    // Remove certain trac macros
    .replace(/\[\[([^\]]+)\]\]/g, function (match, name) {
      for (const macro in excludeMacros) {
        if (name.toLowerCase().startsWith(excludeMacros[macro])) return ''
      }
      return match
    })
    // Replace double newlines with paragraphs
    .split(/(?:\r?\n)/g)
    // Work on single lines
    .map((line) => {
      let ret = ''
      if (listStarted && !rlists.test(line)) {
        listStarted = false
        ret += '</ul>'
      } else if (blockquoteStarted && !rblockquote.test(line)) {
        blockquoteStarted = false
        ret += '</blockquote>'
      }
      if (!line.trim()) {
        return ret
      }
      if (line.startsWith('<pre')) {
        return ret + line
      }
      // Headers
      if (rheaders.test(line)) {
        return (
          ret +
          line.replace(rheaders, (_all, equals, content) => {
            const level = equals.length
            return `<h${level}>${content}</h${level}>`
          })
        )
      }
      // Lists
      if (rlists.test(line)) {
        line = line.replace(
          /(^|\s+)[\*-] ([^]+)/g,
          `$1${listStarted ? '' : '<ul>'}<li>$2</li>`
        )
        listStarted = true
        return ret + line
      }
      // Blockquotes
      if (rblockquote.test(line)) {
        if (!blockquoteStarted) {
          blockquoteStarted = true
          ret += '<blockquote>'
        }
        return ret + line.replace(rblockquote, ' ')
      }
      return ret + `<p>${line}</p>`
    })
    .join('')

  if (listStarted) {
    html += '</ul>'
  }
  if (blockquoteStarted) {
    html += '</blockquote>'
  }

  return (
    html
      // Reinsert code
      .replace(/<code><\/code>/g, () => {
        const code = codes.shift()
        return `<code>${code}</code>`
      })
      // Reinsert pres
      .replace(/<pre class="wiki"><\/pre>/g, () => {
        const code = pres.shift()
        return `<pre class="wiki">${code}</pre>`
      })
  )
}
