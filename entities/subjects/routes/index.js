const addSubjectHandler = require("../controllers/addSubjectHandler");
const getSubjectsHandler = require("../controllers/getSubjectsHandler");
const express = require('express');
const router = express.Router();


router.post("/", getSubjectsHandler.getSubjectsHandlerPost);

router.post("/addSubject", addSubjectHandler.addSubjectHandlerPost);

module.exports = router;
