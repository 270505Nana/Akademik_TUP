import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test Database connection
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connected successfully!');

    // Start HTTP Server
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`Local:            http://localhost:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
