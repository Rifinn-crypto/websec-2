const express = require('express');
const router = express.Router();
const db = require('../db.json');

router.get('/', (req, res) => {
  const { groupId, teacherId, weekId } = req.query;

  let schedule = db.schedule;

  if (groupId) {
    schedule = schedule.filter(item => item.groupId == groupId);
  }

  if (teacherId) {
    schedule = schedule.filter(item => item.teacherId == teacherId);
  }

  if (weekId) {
    schedule = schedule.filter(item => item.weekId == weekId);
  }

  res.json(schedule);
});

module.exports = router;
