const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

let sequelize;

if (dbUrl) {
  console.log('✅ Using Database URL for connection (starts with):', dbUrl.substring(0, 15) + '...');
  // Use connection URL if provided (common in Railway/Render)
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  });
} else {
  console.log('⚠️ No Database URL found. Falling back to separate variables. Host:', process.env.DB_HOST || process.env.MYSQLHOST || 'localhost (DEFAULT)');
  // Fallback to separate variables
  sequelize = new Sequelize(
    process.env.DB_NAME || process.env.MYSQLDATABASE,
    process.env.DB_USER || process.env.MYSQLUSER,
    process.env.DB_PASS || process.env.MYSQLPASSWORD || '',
    {
      host: process.env.DB_HOST || process.env.MYSQLHOST,
      port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    }
  );
}

module.exports = sequelize;
