import * as cheerio from 'cheerio'
import { writeDBFile, TEAMS, PRESIDENTS } from '../db/index.js'

// import TEAMS from '../db/teams.json' assert {type: 'json'}

const URLS = {
  leaderboard: 'https://kingsleague.pro/estadisticas/clasificacion/'
}

async function scrape (url) {
  const res = await fetch(url)
  const html = await res.text()

  return cheerio.load(html)
}

async function getLeaderboard () {
  const $ = await scrape(URLS.leaderboard)
  const $row = $('table tbody tr')

  const LEADERBOARD_SELECTORS = {
    team: { selector: '.fs-table-text_3', typeOf: 'string' },
    wins: { selector: '.fs-table-text_4', typeOf: 'number' },
    loses: { selector: '.fs-table-text_5', typeOf: 'number' },
    goalsScored: { selector: '.fs-table-text_6', typeOf: 'number' },
    goalsConceded: { selector: '.fs-table-text_7', typeOf: 'number' },
    cardsYellow: { selector: '.fs-table-text_8', typeOf: 'number' },
    cardsRed: { selector: '.fs-table-text_9', typeOf: 'number' }
  }

  const getTeamFrom = ({ name }) => {
    const { presidentId, ...restOfTeam } = TEAMS.find(team => team.name === name)
    const president = PRESIDENTS.find(p => p.id === presidentId)
    return { president, ...restOfTeam }
  }

  const cleanText = text => text
    .replace(/\t|\n|\s:/g, '')
    .replace(/.*:/g, '')
    .trim()

  const leaderboard = []
  $row.each((index, el) => {
    const $el = $(el)

    const leaderBoardSelectorsEntries = Object.entries(LEADERBOARD_SELECTORS)

    const leaderBoardEntries = leaderBoardSelectorsEntries.map(([key, { selector, typeOf }]) => {
      const rawValue = $el.find(selector).text()
      const cleanedValue = cleanText(rawValue)
      const value = typeOf === 'number' ? Number(cleanedValue) : cleanedValue
      return [key, value]
    })

    const { team: teamName, ...leaderboardForTeam } = Object.fromEntries(leaderBoardEntries)
    const team = getTeamFrom({ name: teamName })

    leaderboard.push({ team, ...leaderboardForTeam })
  })

  return leaderboard
}

const leaderboard = await getLeaderboard(URLS.leaderboard)

await writeDBFile('leaderboard', leaderboard)
