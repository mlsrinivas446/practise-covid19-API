const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
app.use(express.json())
module.exports = app
let db = null

const dbPath = path.join(__dirname, 'covid19India.db')

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB ERROR: ${error.message}`)
  }
}
initializeDBServer()

app.get('/states/', async (request, response) => {
  const getAllStateQuery = `SELECT state_id as stateId, state_name as stateName,population as population
                            FROM 
                              state`
  const statesListArray = await db.all(getAllStateQuery)
  response.send(statesListArray)
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `SELECT state_id as stateId, state_name as stateName,population as population
                          FROM 
                            state 
                          WHERE 
                            state_id=${stateId}`
  const getState = await db.get(getStateQuery)
  response.send(getState)
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postStateQuery = `INSERT INTO 
                            district (district_name, state_id, cases, cured, active, deaths) 
                          VALUES 
                              ('${districtName}',
                              ${stateId},
                              ${cases},
                              ${cured},
                              ${active},
                              ${deaths});`
  console.log(postStateQuery)
  const stateDetailes = await db.run(postStateQuery)
  const district_id = stateDetailes.lastID
  console.log(district_id)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `SELECT district_id as districtId,district_name as districtName, state_id as stateId,cases, cured, active, deaths FROM district WHERE district_id=${districtId};`
  const getDistrict = await db.get(getDistrictQuery)
  response.send(getDistrict)
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `DELETE FROM district WHERE district_id=${districtId};`
  const getDistrict = await db.get(getDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const putStateQuery = `UPDATE
                            district
                          SET 
                              district_name='${districtName}',
                              state_id=${stateId},
                              cases=${cases},
                              cured=${cured},
                              active=${active},
                              deaths=${deaths};   
                          WHERE 
                              district_id=${districtId};`
  console.log(putStateQuery)
  const districtDetails = await db.run(putStateQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`
  const stats = await db.get(getStateStatsQuery)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getstateIdQuery = `SELECT * FROM district NATURAL JOIN state WHERE district_id=${districtId};`
  const state = await db.get(getstateIdQuery)
  response.send({stateName: state.state_name})
})
