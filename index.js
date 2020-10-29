#!/usr/bin/env node

const commandLineArgs = require('command-line-args')
const csv = require('csv-parser')
const fs = require('fs')

const quit = (message) => {
  console.log(message)
  process.exit(9)
}

const cliOptions = [
  { name: 'input', defaultOption: true },
  { name: 'format', defaultValue: 'markdown' }
]

const cli = commandLineArgs(cliOptions)

try {

  // Ensure we have an input file to parse
  if (typeof cli.input === 'undefined') quit('You must specify an input file.')
  if (!fs.existsSync(cli.input)) quit(`Input file ${cli.input} couldn't be found or doesn't exist.`)

  // Prepare structured data
  const links = {}

  // Open and parse CSV
  fs.createReadStream(cli.input)
    .pipe(csv(['Name', 'Created', 'Summary', 'Tags', 'URL']))
    .on('data', (data) => {

      let item = {}
      Object.keys(data).forEach((row) => {
        if (row !== 'Tags' && row !== 'Created') item[row] = data[row]
      })
      if (!Array.isArray(links[data.Tags])) links[data['Tags']] = []
      links[data['Tags']].push(item)
    })
    .on('end', () => {

      const categories = Object.keys(links)
      categories.forEach((category) => {

        if (!category || !Array.isArray(links[category])) return

        switch(cli.format) {
          case 'markdown':
              console.log(`#### ${category}\n`)
            break;
          case 'html':
              console.log(`<h4>${category}</h4>\n`)
            break;
        }

        links[category].forEach((item) => {
          switch(cli.format) {
            case 'markdown':
              console.log(`[${item.Name}](${item.URL}). ${item.Summary.trim()}\n`)
              break;
            case 'html':
              console.log(`<p><a href="${item.URL}">${item.Name}</a>. ${item.Summary.trim()}</p>\n`)
              break;
          }
        })

      })

    })

} catch (err) {
  quit(err)
}
