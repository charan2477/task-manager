const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Use MYSQL_URL if provided (Railway often sets this), otherwise use individual vars
if (process.env.MYSQL_URL) {
  sequelize = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  });
} else {
  const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME;
  const dbUser = process.env.MYSQLUSER || process.env.DB_USER;
  const dbPass = process.env.MYSQLPASSWORD || process.env.DB_PASS || '';
  const dbHost = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10);

  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  });
}

module.exports = sequelize;
