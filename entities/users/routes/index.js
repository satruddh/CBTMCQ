const signupController = require('../controllers/signupContoller');
const loginController = require("../controllers/loginController");
const userController = require("../controllers/userController");
const logoutController = require('../controllers/logoutController');

const express = require('express');
const router = express.Router();

router.post('/signup', signupController.PostReq);
router.post('/login', loginController.PostReq);

router.get('/signup', signupController.GetReq);
router.get('/login', loginController.GetReq);

router.delete("/deleteUser", userController.deletePostReq);
router.put("/updateUser", userController.updatePostReq);

router.get("/logout", logoutController)

module.exports = router;