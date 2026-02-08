import { readFileSync } from 'node:fs'
import { argv, exit } from 'node:process'

const version = argv[2]
if (!version) {
  console.error('Usage: node extract-release-notes.mjs <version>')
  exit(1)
}

const changelogPath = 'apps/monkey/CHANGELOG.md'

let content
try {
  content = readFileSync(changelogPath, 'utf-8')
}
catch {
  console.log(`Release v${version}`)
  exit(0)
}

const lines = content.split('\n')
let found = false
const notes = []

for (const line of lines) {
  if (line.startsWith('## ')) {
    if (found)
      break
    if (line.replace('## ', '').trim() === version)
      found = true
    continue
  }
  if (found)
    notes.push(line)
}

/** 去除首尾空行 */
const trimmed = notes.join('\n').trim()
console.log(trimmed || `Release v${version}`)
