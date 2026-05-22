const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');
const studentRoutes = require('./routes/studentRoutes');
const gradingRoutes = require('./routes/gradingRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exams', examRoutes);
app.use('/api', questionRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', gradingRoutes);
app.use('/api', statisticsRoutes);

app.use(errorHandler);

module.exports = app;
