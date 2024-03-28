const { parse } = require("dotenv");

function catchAsync(asyncFunction) {
	return async function (...args) {
		try {
			// Call the provided async function with the arguments
			return await asyncFunction(...args);
		} catch (error) {
			// Do nothing
		}
	};
}

async function createAllTables(db) {
	// Create movie table
	await db.none(`CREATE TABLE movie (
    id VARCHAR(10) PRIMARY KEY,
    title TEXT,
    originalTitle TEXT,
    fullTitle TEXT,
    year INTEGER,
    image TEXT,
    releaseDate TEXT,
    runtimeStr TEXT,
    plot TEXT,
    awards TEXT,
    companies TEXT,
    countries TEXT,
    languages TEXT,
    imDbRating NUMERIC,
    boxOffice TEXT,
    plotFull TEXT
  )`);

	// create name table
	await db.none(`
  CREATE TABLE name (
    id VARCHAR(10) PRIMARY KEY,
    name TEXT,
    role TEXT,
    image TEXT,
    summary TEXT,
    birthDate TEXT,
    deathDate TEXT,
    awards TEXT,
    height TEXT
  )`);

	// create castmovie table
	await db.none(`
  CREATE TABLE name_castmovie (
    movieId VARCHAR(10) REFERENCES movie(id),
    nameId VARCHAR(10) REFERENCES name(id),
    role TEXT,

    PRIMARY KEY (movieId, nameId)
  )`);

	// create name_image table
	await db.none(`
    CREATE TABLE name_image (
      nameId VARCHAR(10) REFERENCES name(id),
      title TEXT,
      image TEXT
    );

    CREATE INDEX idx_name_image_nameId ON name_image (nameId);
  `);

	// create movie_director table
	await db.none(`
    create table movie_director (
      movieId VARCHAR(10) REFERENCES movie(id),
      nameId VARCHAR(10) REFERENCES name(id),

      PRIMARY KEY (movieId, nameId)
    )`);

	// create movie_writer table
	await db.none(`
    create table movie_writer (
      movieId VARCHAR(10) REFERENCES movie(id),
      nameId VARCHAR(10) REFERENCES name(id)
    )`);

	// create movie_actor table
	await db.none(`
    create table movie_actor (
      movieId VARCHAR(10) REFERENCES movie(id),
      nameId VARCHAR(10) REFERENCES name(id),
      asCharacter TEXT
    )`);

	// create movie_genre table
	await db.none(`
    create table movie_genre (
      movieId VARCHAR(10) REFERENCES movie(id),
      genre TEXT
    );

    CREATE INDEX idx_movie_genre_movieId ON movie_genre (movieId);
  `);

	// create movie_poster table
	await db.none(`
    create table movie_poster (
      movieId VARCHAR(10) REFERENCES movie(id),
      link TEXT,
      language TEXT,
      width INTEGER,
      height INTEGER
    );

    CREATE INDEX idx_movie_poster_movieId ON movie_poster (movieId);
`);

	// create movie_image table
	await db.none(`
    create table movie_image (
      movieId VARCHAR(10) REFERENCES movie(id),
      title TEXT,
      image TEXT
    );

    CREATE INDEX idx_movie_image_movieId ON movie_image (movieId);
`);

	// create movie_similar table
	await db.none(`
    create table movie_similar (
      movieId VARCHAR(10) REFERENCES movie(id),
      similarId VARCHAR(10) REFERENCES movie(id),

      PRIMARY KEY (movieId, similarId)
    )
`);

	// create review table
	await db.none(`
    create table review (
      movieId VARCHAR(10) REFERENCES movie(id),
      username TEXT,
      warningSpoilers BOOLEAN,
      date TEXT,
      rate TEXT,
      title TEXT,
      content TEXT
    );

    CREATE INDEX idx_review_movieId ON review (movieId);
`);
}

async function createFavMovieTable(db) {
	await db.none(`
    CREATE TABLE fav_movie (
      movieId VARCHAR(10) REFERENCES movie(id),

      PRIMARY KEY (movieId)
    )
  `);
}

async function importData(db) {
	// Import data from json file
	const data = require("../data/data.json");
	const movies = data.Movies;
	const names = data.Names;
	const reviews = data.Reviews;

	// STEP 1:  Import movie data (without any relations to Name table)
	movies.forEach(
		catchAsync(async (movie) => {
			await db.none(
				`
      INSERT INTO movie (
        id,
        title,
        originalTitle,
        fullTitle,
        year,
        image,
        releaseDate,
        runtimeStr,
        plot,
        awards,
        companies,
        countries,
        languages,
        imDbRating,
        boxOffice,
        plotFull
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16
      )
    `,
				[
					movie.id,
					movie.title,
					movie.originalTitle,
					movie.fullTitle,
					movie.year,
					movie.image,
					movie.releaseDate,
					movie.runtimeStr,
					movie.plot,
					movie.awards,
					movie.companies,
					movie.countries,
					movie.languages,
					parseFloat(movie.imDbRating),
					movie.boxOffice,
					movie.plotFull,
				]
			);
			// Import movie genre
			movie.genreList?.forEach(async (genre) => {
				await db.none(
					`
        INSERT INTO movie_genre (
          movieId,
          genre
        )
        VALUES (
          $1,
          $2
        )
      `,
					[movie.id, genre]
				);
			});
			// Import movie poster
			movie.posters?.forEach(async (poster) => {
				await db.none(
					`
        INSERT INTO movie_poster (
          movieId,
          link,
          language,
          width,
          height
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
      `,
					[movie.id, poster.link, poster.language, poster.width, poster.height]
				);
			});
			// Import movie image
			movie.images?.forEach(async (image) => {
				await db.none(
					`
        INSERT INTO movie_image (
          movieId,
          title,
          image
        )
        VALUES (
          $1,
          $2,
          $3
        )
      `,
					[movie.id, image.title, image.image]
				);
			});
		})
	);

	// Step 1.5: Import similar movies (must be done after all movies are imported)
	movies.forEach(
		catchAsync(async (movie) => {
			movie.similars?.forEach(
				catchAsync(async (similar) => {
					await db.none(
						`
          INSERT INTO movie_similar (
            movieId,
            similarId
          )
          VALUES (
            $1,
            $2
          )
        `,
						[movie.id, similar]
					);
				})
			);
		})
	);

	// STEP 2: Import name data
	names.forEach(
		catchAsync(async (name) => {
			await db.none(
				`
      INSERT INTO name (
        id,
        name,
        role,
        image,
        summary,
        birthDate,
        deathDate,
        awards,
        height
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      )
    `,
				[
					name.id,
					name.name,
					name.role,
					name.image,
					name.summary,
					name.birthDate,
					name.deathDate,
					name.awards,
					name.height,
				]
			);

			// Import name castmovie
			name.castMovies?.forEach(
				catchAsync(async (castMovie) => {
					// // Check if movieId exists
					// const movie = await db.oneOrNone(
					// 	`
					//     SELECT * FROM movie WHERE id = $1
					//   `,
					// 	[castMovie.id]
					// );
					// if (!movie) return;

					// Insert into name_castmovie
					await db.none(
						`
        INSERT INTO name_castmovie (
          movieId,
          nameId,
          role
        )
        VALUES (
          $1,
          $2,
          $3
        )
      `,
						[castMovie.id, name.id, castMovie.role]
					);
				})
			);

			// Import name image
			name.images?.forEach(async (image) => {
				await db.none(
					`
        INSERT INTO name_image (
          nameId,
          title,
          image
        )
        VALUES (
          $1,
          $2,
          $3
        )
      `,
					[name.id, image.title, image.image]
				);
			});
		})
	);

	// STEP 3: Import review data
	reviews.forEach(async (movieReviews) => {
		movieReviews.items?.forEach(
			catchAsync(async (review) => {
				await db.none(
					`
        INSERT INTO review (
          movieId,
          username,
          warningSpoilers,
          date,
          rate,
          title,
          content
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
      `,
					[
						movieReviews.movieId,
						review.username,
						review.warningSpoilers,
						review.date,
						review.rate,
						review.title,
						review.content,
					]
				);
			})
		);
	});

	// STEP 4: Import movie director, writer, actor
	movies.forEach(async (movie) => {
		movie.directorList?.forEach(
			catchAsync(async (director) => {
				// // Check if nameId exists
				// const name = await db.oneOrNone(
				// 	`
				//     SELECT * FROM name WHERE id = $1
				//   `,
				// 	[director]
				// );
				// if (!name) return;

				await db.none(
					`
        INSERT INTO movie_director (
          movieId,
          nameId
        )
        VALUES (
          $1,
          $2
        )
      `,
					[movie.id, director]
				);
			})
		);

		movie.writerList?.forEach(
			catchAsync(async (writer) => {
				// // Check if nameId exists
				// const name = await db.oneOrNone(
				// 	`
				//     SELECT * FROM name WHERE id = $1
				//   `,
				// 	[writer]
				// );
				// if (!name) return;

				// Insert into movie_writer
				await db.none(
					`
        INSERT INTO movie_writer (
          movieId,
          nameId
        )
        VALUES (
          $1,
          $2
        )
      `,
					[movie.id, writer]
				);
			})
		);

		movie.actorList?.forEach(
			catchAsync(async (actor) => {
				// // Check if nameId exists
				// const name = await db.oneOrNone(
				// 	`
				//     SELECT * FROM name WHERE id = $1
				//   `,
				// 	[actor.id]
				// );
				// if (!name) return;

				// Insert into movie_actor
				await db.none(
					`
        INSERT INTO movie_actor (
          movieId,
          nameId,
          asCharacter
        )
        VALUES (
          $1,
          $2,
          $3
        )`,
					[movie.id, actor.id, actor.asCharacter]
				);
			})
		);
	});
}

async function populateDatabase(db) {
	await createAllTables(db);
	await createFavMovieTable(db);
	await importData(db);
}

module.exports = populateDatabase;