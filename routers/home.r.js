// const homeC = require("../controllers/home.c");
// const uploadDataW = require("../controllers/uploadData");
// const app = require("express");
// const router = app.Router();
// router.get("/", homeC.load);
// module.exports = router;


const express = require("express");
const routers = express.Router();

const homeController = require("../controllers/home.c");


routers.get("/", homeController.getAllMov);
// routers.get("/addUser", userController.addUserGet);
// routers.get("/user/:id", userController.getUserInfo);
// routers.get("/edit/:id", userController.editUser);
// routers.get("/delete/:id", userController.deleteUser);
// routers.post("/", userController.searchUser);
// routers.post("/addUser", userController.addUserPost);
// routers.post("/edit/:id", userController.updateUser);

module.exports = routers;