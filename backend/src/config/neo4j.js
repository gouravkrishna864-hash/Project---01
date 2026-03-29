const neo4j = require('neo4j-driver');
const logger = require('./logger');

let driver;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'reos_neo4j'
      ),
      { maxConnectionPoolSize: 50 }
    );
  }
  return driver;
}

async function runQuery(cypher, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
    logger.info('Neo4j driver closed');
  }
}

module.exports = { getDriver, runQuery, closeDriver };
