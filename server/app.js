const express = require('express');
const cors = require('cors');
const groupsRoutes = require('./routes/groups');
const teachersRoutes = require('./routes/teachers');
const weeksRoutes = require('./routes/weeks');
const scheduleRoutes = require('./routes/schedule');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/groups', groupsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/weeks', weeksRoutes);
app.use('/api/schedule', scheduleRoutes);

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
