const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

admin.initializeApp();
const db = admin.firestore();

const TMDB_API_KEY = "1ae9023586e025365a5e29a3207c8533";
const TMDB_BASE_URL = "https://api.themoviedb.org";
const TMDB_BASE_PHOTO_URL = "https://image.tmdb.org/t/p/w185";

const GENRES = [
  {
    id: 28,
    name: "Action",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 12,
    name: "Adventure",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 16,
    name: "Animation",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 35,
    name: "Comedy",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 80,
    name: "Crime",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 99,
    name: "Documentary",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 18,
    name: "Drama",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 10751,
    name: "Family",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 14,
    name: "Fantasy",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 36,
    name: "History",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 27,
    name: "Horror",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 10402,
    name: "Music",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 9648,
    name: "Mystery",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 10749,
    name: "Romance",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 878,
    name: "Science Fiction",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 53,
    name: "Thriller",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
  {
    id: 10752,
    name: "War",
    photo:
      "https://e0.pxfuel.com/wallpapers/514/384/desktop-wallpaper-john-wick-cartoon-john-wick-anime.jpg",
  },
];

// Middleware to authenticate incoming requests
const authenticateRequest = async (req, res, next) => {
  const headerToken = req.headers.authorization;
  if (!headerToken || !headerToken.startsWith("Bearer ")) {
    const deviceId = req.headers.deviceid;
    functions.logger.info("Function completed successfully.");
    //functions.logger.info('deviceId: ' + deviceId);
    if (deviceId) {
      return next();
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const token = headerToken.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (err) {
    console.error("Error while verifying Firebase ID token:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

function getUserId(req) {
  if (req.user) {
    return req.user.uid;
  } else {
    return req.headers.deviceid;
  }
}

async function getDiscoverMovies(genres, sort) {
  const minVoteAverage = 5;
  const minReleaseDate = "1990-01-01";
  const maxReleaseDate = new Date().toLocaleDateString("en-CA");
  const page = 1;

  const discoverUrl = `${TMDB_BASE_URL}/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genres.join(
    ","
  )}&sort_by=${sort}&language=en-US&vote_average.gte=${minVoteAverage}&release_date.gte=${minReleaseDate}&release_date.lte=${maxReleaseDate}&page=${page}`;

  try {
    const response = await axios.get(discoverUrl);
    const data = response.data;
    const movies = data.results.map((movie) => {
      return {
        id: movie.id,
        title: movie.title,
        poster_path: TMDB_BASE_PHOTO_URL + movie.poster_path,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
        genres: movie.genre_ids.map(id => {
          const genre = GENRES.find(genre => genre.id === id);
          return genre ? genre.name : null;
        }).filter(name => name !== null) || []
      };
    });
    return movies;
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw new Error("Failed to fetch movies");
  }
}

async function getMovieIdsByUserIdAndAction(userId, action = null) {
  try {
    let query = admin
      .firestore()
      .collection("action")
      .where("user_id", "==", userId);
    if (action) {
      query = query.where("action", "==", action);
    }
    const snapshot = await query.get();
    const movieIds = snapshot.docs.map((doc) => doc.data().movie_id);
    return movieIds;
  } catch (error) {
    console.error("Error retrieving movie ids:", error);
    throw new Error("Failed to retrieve movie ids");
  }
}

app.get("/genres", authenticateRequest, async (req, res) => {

  const userId = getUserId(req);
  let userGenres = [];
  try {
    const doc = await db.collection("genres").doc(userId).get();
    userGenres = doc.data().genres;
  } catch (error) {
  }

  const genresWithSelection = GENRES.map((genre) => ({
    ...genre,
    isSelected: userGenres ? userGenres.includes(genre.id) : false,
  }));

  res.send({
    genres: genresWithSelection,
  });
});

app.post("/genres", authenticateRequest, (req, res) => {
  const genres = req.body.genres;
  const userId = getUserId(req);
  if (genres == undefined || userId == undefined) {
    res.status(500).send({ result: "failure" });
  }

  const data = { genres: genres };
  db.collection("genres")
    .doc(userId)
    .set(data, { merge: true })
    .then(() => {
      res.send({ result: "success" });
    })
    .catch((error) => {
      res.status(500).send({ result: "failure" });
    });
});

app.get("/movies", authenticateRequest, async (req, res) => {
  const userId = getUserId(req);
  let genres = undefined;
  try {
    const doc = await db.collection("genres").doc(userId).get();
    genres = doc.data().genres;
  } catch (error) {
    return res.status(400).send({
      error: {
        code: 1,
        message: "No genres selected",
      },
    });
  }
  if (!genres || !genres.length) {
    return res.status(400).send({
      error: {
        code: 1,
        message: "No genres selected",
      },
    });
  }

  //TODO: implement Similar
  //TODO: implement Recommendations
  try {
    const sortList = [
      "popularity.desc",
      "vote_average.desc",
      "vote_count.desc",
    ];
    const sort = sortList[Math.floor(Math.random() * sortList.length)];
    const movies = await getDiscoverMovies(genres, sort);

    const pastMovieIds = await getMovieIdsByUserIdAndAction(userId, undefined);

    const filteredMovies = movies.filter(
      (movie) => !pastMovieIds.includes(movie.id)
    );

    res.send({
      movies: filteredMovies,
      source: sort,
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).send({
      error: {
        code: 2,
        message: "Failed to fetch movies",
      },
    });
  }
});

app.get("/movies/:movieId/videos", authenticateRequest, async (req, res) => {
  const movieId = req.params.movieId;
  const videosUrl = `${TMDB_BASE_URL}/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;

  try {
    const response = await axios.get(videosUrl);
    const data = response.data;
    const videos = data.results.map((video) => {
      return {
        id: video.id,
        key: video.key,
        name: video.name,
        type: video.type,
      };
    });
    res.send({
      videos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).send({
      error: {
        code: 2,
        message: "Failed to fetch videos",
      },
    });
  }
});

app.post("/movieAction", authenticateRequest, async (req, res) => {
  const userId = getUserId(req);
  const action = req.body.action;
  const movieId = req.body.movieId;

  try {
    const docRef = await admin.firestore().collection("action").add({
      action: action,
      movie_id: movieId,
      user_id: userId,
      date: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({
      message: "Action created successfully",
      id: docRef.id,
    });
  } catch (error) {
    console.error("Error creating action:", error);
    res.status(500).json({ error: "Failed to create action" });
  }
});

app.get("/movieActions", async (req, res) => {
  const userId = getUserId(req);
  const action = req.query.action;
  try {
    const snapshot = await admin
      .firestore()
      .collection("action")
      .where("user_id", "==", userId)
      .where("action", "==", action)
      .orderBy("date", "desc")
      .get();

    const actions = snapshot.docs.map((doc) => ({
      id: doc.id,
      action: doc.data().action,
      movie_id: doc.data().movie_id,
      user_id: doc.data().user_id,
      date: doc.data().date.toDate().toISOString(),
    }));

    res.json({ actions });
  } catch (error) {
    console.error("Error retrieving actions:", error);
    res.status(500).json({ error: "Failed to retrieve actions" });
  }
});

exports.api = functions.https.onRequest(app);
