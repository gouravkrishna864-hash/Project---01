const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: (msg) => {
    if (process.env.NODE_ENV === 'development') logger.debug(msg);
  },
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production'
      ? { require: true, rejectUnauthorized: false }
      : false,
  },
});

module.exports = { sequelize, Sequelize };
