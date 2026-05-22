require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`ExamFlow backend listening on port ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
