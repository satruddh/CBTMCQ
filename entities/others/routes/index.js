const sessionController = require("../controllers/sessionController")

const express = require('express');
const router = express.Router();

router.get('/session', sessionController.GetReq);

module.exports = router;