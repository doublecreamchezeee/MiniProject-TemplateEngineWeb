// const DBProvider = require("../db/db21575");
// const fs = require("fs");
// const tableName = "person";
// const pathToFile = "../21120575/data/data.json"

// module.exports = class User {
//   static loadAPI = false;
//   constructor({ movies, names, reviews }) {
//     this.movies = movies;
//     this.names = names;
//     this.reviews = reviews;
//   }
//   static async getAll() {
//     // const data = await fetch("../data/data.json");
//     // console.log(data);
//     const jsonData = await fs.readFileSync(pathToFile);
//     const jsonObject = await JSON.parse(jsonData);
//     const { Movies: movies, Names: names, Reviews: reviews } = jsonObject;
//     return movies;
//   }
// };

const db = require("../db/db21575.js");
const pgp = require('pg-promise')();

class Movie {

	async populateMovie(movie) {


		// Populate movie with actors
		const actors = await db.any(
			`SELECT name.*
      FROM movie_actor JOIN name ON movie_actor.nameId = name.id
      WHERE movieId = $1`,
			[movie.id]
		);
		movie.actorList = actors;

		// Populate movie with directorList
		const directors = await db.any(
			`SELECT name.*
      FROM movie_director JOIN name ON movie_director.nameId = name.id
      WHERE movieId = $1`,
			[movie.id]
		);
		movie.directorList = directors;

		// Populate movie with writerList
		const writers = await db.any(
			`SELECT name.*
      FROM movie_writer JOIN name ON movie_writer.nameId = name.id
      WHERE movieId = $1`,
			[movie.id]
		);
		movie.writerList = writers;

		// Populate movie with genreList
		const genres = await db.any(
			`SELECT ARRAY_AGG(movie_genre.genre) AS genreList
      FROM movie_genre
      WHERE movieId = $1`,
			[movie.id]
		);
		movie.genreList = genres[0].genrelist;

		// Populate movie with images
		const images = await db.any(
			`SELECT movie_image.title, movie_image.image
      FROM movie_image
      WHERE movieId = $1`,
			[movie.id]
		);
		movie.images = images;

		// Populate movie with posters
		const posters = await db.any(
			`SELECT movie_poster.*
      FROM movie_poster
      WHERE movieId = $1`,
			[movie.id]
		);
		movie.posters = posters;

		const similars = await db.any(
			`SELECT movie.*
       FROM movie_similar JOIN movie ON movie_similar.similarid = movie.id
       WHERE movie_similar.movieid = $1
       `,
			[movie.id]
		);
		movie.similars = similars;

		return movie;
	}

	async populate(data) {
		if (!data) return data;

		if (Array.isArray(data)) {
			return await Promise.all(
				data.map(async (movie) => {
					return await this.populateMovie(movie);
				})
			);
		} else {
			return await this.populateMovie(data);
		}
	}

	async find() {
    try {
      // Thông tin kết nối
      const connectionConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'db21575', // Tên cơ sở dữ liệu bạn muốn kết nối
      };

      // Tạo đối tượng kết nối
      const db = pgp(connectionConfig);

      // Kiểm tra tên database
      const databaseName = await db.one(`SELECT current_database()`);
      console.log(`Database Name: ${databaseName.current_database}`);
  
      // Thực hiện truy vấn SELECT * FROM movie
      const movies = await db.any(`SELECT * FROM movie`);
      // return await this.populate(movies);
      return await movies;

    } catch (error) {
      console.error("Error:", error.message);
      // Xử lý lỗi nếu có
      throw error;
    }
	}

	async findOneById(id) {
		const movie = await db.oneOrNone(
			`
    SELECT *
    FROM movie WHERE id = $1`,
			[id]
		);

		return await this.populate(movie);
	}

	async findOneBySearch(searchStr) {
		// Search for movies by title or actors
		const movie = await db.any(
			`SELECT * 
      FROM movie JOIN movie_actor ON movie.id = movie_actor.movieId
      JOIN name ON name.id = movie_actor.nameId
      WHERE title ILIKE $1 OR name.name ILIKE $1
      `,
			[`%${searchStr}%`]
		);

		return await this.populate(movie);
	}

	async findTop5Rated() {
		const movies = await db.any(
			`SELECT *
      FROM movie
      ORDER BY imDbRating DESC
      LIMIT 5
      `
		);

		return await this.populate(movies);
	}

	async findTop30BoxOffice() {
		const movies = await db.any(
			`SELECT *
      FROM movie
      WHERE imDbRating LIKE '$%'
      ORDER BY replace(boxOffice, '$', '')::numeric DESC
      LIMIT 30
      `
		);

		return await this.populate(movies);
	}

	async findFavorites() {
		const movies = await db.any(
			`SELECT *
      FROM movie JOIN fav_movie ON movie.id = fav_movie.movieId
      ORDER BY movie.imDbRating DESC
      `
		);

		return await this.populate(movies);
	}

	async addFavorite(movieId) {
		return await db.any(
			`INSERT INTO fav_movie (movieId)
      VALUES ($1)
      `,
			[movieId]
		);
	}

	async removeFavorite(movieId) {
		return await db.any(
			`DELETE FROM fav_movie
      WHERE movieId = $1
      `,
			[movieId]
		);
	}
}

module.exports = new Movie();