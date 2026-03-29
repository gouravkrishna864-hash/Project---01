// Mock all external service deps so unit tests run without live connections

jest.mock('../config/neo4j', () => ({
  runQuery: jest.fn().mockResolvedValue([]),
  getDriver: jest.fn(),
  closeDriver: jest.fn(),
}));

jest.mock('../config/redis', () => ({
  redis: {
    get: jest.fn(), set: jest.fn(), setex: jest.fn(), del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    lpush: jest.fn(), lrange: jest.fn().mockResolvedValue([]),
    ltrim: jest.fn(), expire: jest.fn(),
  },
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(null),
  delCache: jest.fn().mockResolvedValue(null),
  delCacheByPattern: jest.fn().mockResolvedValue(null),
  CACHE_TTL: { PROPERTY: 300, SEARCH: 60, USER_PROFILE: 600, PRICE_TREND: 3600 },
}));

// Mock Sequelize model factory — returns a plain object with stubs
const modelStub = () => ({
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue(null),
  findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
  create: jest.fn().mockResolvedValue({ id: 'test-id', toJSON: () => ({}) }),
  update: jest.fn().mockResolvedValue([1]),
  increment: jest.fn().mockResolvedValue(null),
  belongsTo: jest.fn(),
  hasMany: jest.fn(),
  beforeCreate: jest.fn(),
  beforeUpdate: jest.fn(),
});

jest.mock('../models/User', () => modelStub());
jest.mock('../models/Property', () => modelStub());
jest.mock('../models/Lead', () => modelStub());
jest.mock('../models/Transaction', () => modelStub());
