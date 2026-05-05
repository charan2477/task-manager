require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();


app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.use(express.json());

app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects/:projectId/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'API running' }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const mysql = require('mysql2/promise');

    let connConfig;
    let dbName;

    if (process.env.MYSQL_URL) {
      // Parse the MYSQL_URL connection string
      const url = new URL(process.env.MYSQL_URL);
      connConfig = {
        host: url.hostname,
        user: url.username,
        password: url.password,
        port: parseInt(url.port || '3306', 10),
      };
      // Database name is the path, strip leading slash
      dbName = url.pathname.replace(/^\//, '') || 'task_manager_db';
    } else {
      connConfig = {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASS || '',
        port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10),
      };
      dbName = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'task_manager_db';
    }

    const connection = await mysql.createConnection(connConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
    console.log(`✅ Database "${dbName}" ready`);

    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');
    
    app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Database connection failed:');
    console.error(err);
    process.exit(1);
  }
}

startServer();
// Trigger nodemon restart to load .env
