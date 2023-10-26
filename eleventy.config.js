const { DateTime } = require('luxon')

const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const pluginBundle = require('@11ty/eleventy-plugin-bundle')
const pluginNavigation = require('@11ty/eleventy-navigation')
const { EleventyHtmlBasePlugin } = require('@11ty/eleventy')
const pluginFavicon = require('eleventy-favicon')
const CleanCSS = require('clean-css')
const fs = require('node:fs')
const path = require('node:path')
const { exec } = require('node:child_process')

const pluginImages = require('./eleventy.config.images.js')
const tracToHTML = require('./eleventy.config.tracToHTML.js')

module.exports = function (eleventyConfig) {
  // Copy the contents of the `public` folder to the output folder
  // For example, `./public/css/` ends up in `_site/css/`
  eleventyConfig.addPassthroughCopy({
    './public/': '/',
    './node_modules/prismjs/themes/prism.min.css': '/css/prism.min.css'
  })

  const attachTicket =
    process.env.ATTACHMENT_TICKET || (process.env.ATTACHMENT_TICKET = '25')

  // Limit the number of copies during development builds
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[Development] Added attachments for http://localhost:8080/ticket/' +
        attachTicket
    )
    eleventyConfig.addPassthroughCopy({
      [`./raw-attachment/ticket/${attachTicket}`]: `/raw-attachment/ticket/${attachTicket}`,
      [`./zip-attachment/ticket/${attachTicket}`]: `/zip-attachment/ticket/${attachTicket}`
    })
  } else {
    eleventyConfig.addPassthroughCopy(
      {
        './raw-attachment/': '/raw-attachment/',
        './zip-attachment/': '/zip-attachment/'
      },
      {
        // Lower default concurrency to avoid EMFILE errors
        // See https://github.com/11ty/eleventy/issues/2604
        concurrency: 100
      }
    )
  }

  // Run Eleventy when these files change:
  // https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

  // Watch content images for the image pipeline.
  eleventyConfig.addWatchTarget('content/**/*.{svg,webp,png,jpeg}')

  // App plugins
  eleventyConfig.addPlugin(pluginImages)

  // Official plugins
  eleventyConfig.addPlugin(pluginFavicon)
  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    preAttributes: { tabindex: 0 }
  })
  eleventyConfig.addPlugin(pluginNavigation)
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin)
  eleventyConfig.addPlugin(pluginBundle, {
    transforms: [
      function minifyCss(content) {
        if (this.type === 'css') {
          return new CleanCSS({}).minify(content).styles
        }

        return content
      }
    ]
  })

  eleventyConfig.addFilter('debug', (value, stringify) => {
    if (stringify) {
      console.log(JSON.stringify(value, null, 2))
    } else {
      console.log(value)
    }
    return ''
  })

  // Filters
  eleventyConfig.addFilter('isImage', (filename) => {
    return /\.(jpg|jpeg|png|webp|gif|tiff|avif|svg)$/i.test(filename)
  })

  eleventyConfig.addFilter('isPreviewable', (filename) => {
    return /\.(js|html?|diff|patch|css|txt|php)$/i.test(filename)
  })

  eleventyConfig.addFilter('extension', (filename) => {
    return path.extname(filename).replace(/^\./, '')
  })

  eleventyConfig.addFilter('bytesToKilos', (bytes) => {
    const kilos = bytes / 1024
    return `${kilos.toFixed(1)} KB`
  })

  eleventyConfig.addFilter('readableDate', (datetime, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    const date = new Date(datetime / 1000)
    return DateTime.fromJSDate(date, { zone: zone || 'utc' }).toFormat(
      format || 'LLLL dd, yyyy hh:mma z'
    )
  })

  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd')
  })

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('head', (array, n) => {
    if (!Array.isArray(array) || array.length === 0) {
      return []
    }
    if (n < 0) {
      return array.slice(n)
    }

    return array.slice(0, n)
  })

  // Return the smallest number argument
  eleventyConfig.addFilter('min', (...numbers) => {
    return Math.min.apply(null, numbers)
  })

  // Return all the tags used in a collection
  eleventyConfig.addFilter('getAllTags', (collection) => {
    let tagSet = new Set()
    for (let item of collection) {
      ;(item.data.tags || []).forEach((tag) => tagSet.add(tag))
    }
    return Array.from(tagSet)
  })

  eleventyConfig.addFilter('filterTagList', function filterTagList(tags) {
    return (tags || []).filter(
      (tag) => ['all', 'nav', 'post', 'posts'].indexOf(tag) === -1
    )
  })

  eleventyConfig.addFilter('tracToHTML', tracToHTML)

  // Shortcodes
  eleventyConfig.addShortcode('currentYear', () => {
    return DateTime.local().toFormat('yyyy')
  })

  eleventyConfig.addAsyncShortcode('attachment', async (ticketId, filename) => {
    const content = await fs.promises.readFile(
      path.join(__dirname, `raw-attachment/ticket/${ticketId}`, filename)
    )
    return content.toString()
  })

  eleventyConfig.on('eleventy.after', async ({ runMode, outputMode }) => {
    if (
      process.env.NODE_ENV === 'development' &&
      runMode === 'serve' &&
      outputMode === 'fs'
    ) {
      return exec('npm run searchindex', (err, stdout) => {
        if (err) {
          console.error(err)
          return
        }
        console.log(stdout)
      })
    }
  })

  // Features to make your build faster (when you need them)

  // If your passthrough copy gets heavy and cumbersome, add this line
  // to emulate the file copy on the dev server. Learn more:
  // https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

  // eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: ['md', 'njk', 'html', 'liquid'],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: 'njk',

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: 'njk',

    // These are all optional:
    dir: {
      input: 'content', // default: "."
      includes: '../_includes', // default: "_includes"
      data: '../_data', // default: "_data"
      output: '_site'
    },

    // -----------------------------------------------------------------
    // Optional items:
    // -----------------------------------------------------------------

    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

    // When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
    // it will transform any absolute URLs in your HTML to include this
    // folder name and does **not** affect where things go in the output folder.
    pathPrefix: '/'
  }
}
