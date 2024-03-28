const movies = require("../model/movies.m");
const catchAsync = require("../utils/catchAsync");


exports.getAllMov = catchAsync(async (req, res, next) => {
  const movieData = await movies.find();
  res.render("home", {
    incomeMovies: movieData, // Truyền dữ liệu movieData vào biến incomeMovies
    total: movieData.length, // Truyền số lượng phần tử trong movieData vào biến total
  });
});

// async function getAllMov(req, res, next) {
//   try {
//     await movies.getAll();
//     res.render("home", {

//     });
//   } catch (error) {
//     next(error);
//   }
// }

// module.exports = {
//   // GET
//   getAllMov,
//   // addUserGet,
//   // editUser,
//   // deleteUser,
//   // getUserInfo,

//   // // POST
//   // addUserPost,
//   // searchUser,
//   // updateUser,
// };

// exports.load = async (req, res, next) => {
//   try {
//     console.log("loading homepage");
//     let data = dataM.getData();
//     // Thêm các phim vào bảng "movies"
//     // for (const movieData of data.Movies) {
//     //   await moviesM.AddMovies({
//     //     id: movieData.id,
//     //     image: movieData.image,
//     //     title: movieData.title,
//     //     year: movieData.year,
//     //     imdb: parseFloat(movieData.imDbRating),
//     //     genres: movieData.genreList,
//     //   });
//     // }
//     let movies = await moviesM.top(12);
//     res.render("home", { movies: movies });
//   } catch (error) {
//     next(error);
//   }
// };
