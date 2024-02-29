const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'moviesData.db')

const app = express()
app.use(express.json())

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB ERROR: ${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertMovieNametoPascalCase = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

//API 1
app.get('/movies/', async (request, response) => {
  const getAllMovieQuery = `
  SELECT
    movie_name
  FROM
    movie`
  const moviesArray = await db.all(getAllMovieQuery)
  moviesArray.map((moviename) => convertMovieNametoPascalCase(moviename))
})

//API 2
app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `
    INSERT INTO
      movie(director_id, movie_name, lead_actor)
    VALUES
      (
        '${directorId}',
        '${movieName}',
        '${leadActor}'
      )`
  const dbResponse = await db.run(addMovieQuery)
  response.send('Movie Successfully')
})

const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

//API 3
app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
  SELECT
    *
  FROM
    movie
  WHERE
    movie_id = ${movieId}`

  const movie = await db.get(getMovieQuery)
  response.send(convertDbObjectToResponseObject(movie))
})

//API 4
app.put("movies/:movieId/", async (request,response) => {
  const {movieId} = request.params
  const movieDetails = request.body 
  const {directorId, movieName, leadActor} = movieDetails;
  const updateMovieQuery = `
    UPDATE
      movie
    SET
      director_id = ${directorId},
      movie_name = ${movieName},
      lead_actor = ${leadActor}
    WHERE
      movie_id = ${movieId}`
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated")
})

//API 5
app.delete("/movies/:movieId", async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE
    FROM
    movie
  WHERE
    movie_id = ${movieId}
  `
  await db.run(deleteMovieQuery)
  response.send("Movie Removed")
})

//API 6

const convertDirectorDetailsToPascalCase = (dbObject) =>{
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name
  }
}

app.get("/directors/", async (request,response) => {
  const getAllDirectorQuery = `
    SELECT
      *
    FROM
      director`
  const moviesArray = await db.all(getAllDirectorQuery);
  response.send(moviesArray.map((director) => convertDirectorDetailsToPascalCase(director))
});

//API 7

const convertMovieNameToPascalCase = (dbObject) =>{
  return {
    movieName: dbObject.movie_name
  }
}

app.get("/directors/:directorId/movies/", async(request,response) => {
  const {directorId} = request.params 
  const getDirectorMovieQuery = `
    SELECT
      movie_name
    FROM
      director INNERJOIN movie
    ON director.director_id = movie.director_id
    WHERE
      director.director_id = ${directorId}`
  const movies = await db.all(getDirectorMovieQuery)
  response.send(
    movies.map((movienames) => convertMovieNametoPascalCase(movienames))
  )
})

module.exports = app