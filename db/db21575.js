// const fs = require("fs");
// const pathToFile = "../data/data.json";

// module.exports = class DBProvider {
//   filterParams(paramsList, key, defaultValue) {
//     let value = paramsList
//       .filter((queryParam) => queryParam.startsWith(key))
//       .map((queryParam) => queryParam.split("=")[1])[0];
//     return value == undefined ? defaultValue : parseInt(value);
//   }

//   getListDanhThu(movieList) {
//     let list = [];
//     movieList.forEach((movie) => {
//       list.push(movie.boxOffice.cumulativeWorldwideGross);
//     });
//     return list;
//   }

//   getMaxDanhThu(movieList, count) {
//     const list = this.getListDanhThu(movieList);
//     const validDollarStrings = list.filter((str) => str != "");
//     // Bước 2: Chuyển các chuỗi đô la thành giá trị số
//     const numericValues = validDollarStrings.map((str) =>
//       parseFloat(str.replace("$", "").replaceAll(",", ""))
//     );
//     // Bước 3: Sắp xếp mảng số theo thứ tự giảm dần
//     numericValues.sort((a, b) => b - a);
//     // Bước 4: Lấy 3 giá trị lớn nhất
//     const topDanhthu = numericValues.slice(0, count);
//     let res = movieList.filter((movie) => {
//       let str = movie.boxOffice.cumulativeWorldwideGross;
//       return topDanhthu.includes(
//         parseFloat(str.replace("$", "").replaceAll(",", ""))
//       );
//     });
//     for (let i = 0; i < res.length - 1; i++) {
//       for (let j = i; j < res.length; j++) {
//         if (
//           res[i].boxOffice.cumulativeWorldwideGross <
//           res[j].boxOffice.cumulativeWorldwideGross
//         ) {
//           let swap = res[i];
//           res[i] = res[j];
//           res[j] = swap;
//         }
//       }
//     }
//     return res;
//   }

//   async fetch(query) {
//     try {
//       const jsonData = await fs.readFileSync(pathToFile);
//       const jsonObject = await JSON.parse(jsonData);
//       const { Movies: movies, Names: names, Reviews: reviews } = jsonObject;

//       // Your existing logic for handling different types of queries...

//       return {
//         movies,
//         names,
//         reviews,
//       };
//     } catch (e) {
//       console.log(e);
//       return null;
//     }
//   }
// };


const pgp = require("pg-promise")();

let db = pgp({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
});

const databaseName = 'db21575'
db.oneOrNone("SELECT datname FROM pg_database WHERE datname = $1", [
	databaseName,
]).then(async (database) => {
	if (!database) {
    console.log("Creating database");
  
    // Tạo cơ sở dữ liệu mới
    await db.none("CREATE DATABASE $1:name", [databaseName]);
  
    // Tạo một kết nối mới đến cơ sở dữ liệu mới
    const newDb = pgp({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: databaseName,
    });
  
    // Kết nối mới được tạo để thực hiện tác vụ tiếp theo
    await newDb.connect();
  
    const populateDatabase = require("./popularMovData.js");
    await populateDatabase(newDb);
    console.log("Database created and populated");
  
    // Sử dụng kết nối mới để đảm bảo bạn đang thao tác với cơ sở dữ liệu mới
    db = newDb;
  } else {
    console.log("Database exists");
    // Bạn có thể không cần dòng này nếu bạn đã sử dụng kết nối "db" trước đó
    await db.connect();
    // Nếu bạn muốn sử dụng kết nối hiện tại, bạn không cần tạo kết nối mới
    // db = pgp({
    //   host: process.env.DB_HOST,
    //   port: process.env.DB_PORT,
    //   user: process.env.DB_USER,
    //   password: process.env.DB_PASSWORD,
    //   database: databaseName,
    // });
  }
});

module.exports = db;


