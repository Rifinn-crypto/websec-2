const express = require('express');
const router = express.Router();
const db = require('../db.json');

router.get('/', (req, res) => {
  res.json(db.weeks);
});

module.exports = router;
