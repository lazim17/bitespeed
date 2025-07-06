const express = require("express");
const router = express.Router();
const identifyController = require("../controllers/identifyController");

router.post("/", identifyController.handleIdentify);

module.exports = router;
