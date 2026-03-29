const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  listProperties, getProperty, createProperty,
  updateProperty, getRecommendations, getPriceTrend,
} = require('../controllers/propertyController');

const router = express.Router();

router.get('/', listProperties);
router.get('/recommendations', authenticate, getRecommendations);
router.get('/price-trend', getPriceTrend);
router.get('/:id', getProperty);

router.post('/', authenticate, authorize('broker', 'builder', 'admin'), [
  body('title').trim().isLength({ min: 5 }),
  body('type').isIn(['apartment', 'villa', 'plot', 'commercial', 'pg', 'house']),
  body('listing_type').isIn(['sale', 'rent']),
  body('price').isInt({ min: 1 }),
  body('area_sqft').isFloat({ min: 1 }),
  body('address').notEmpty(),
  body('locality').notEmpty(),
  body('city').notEmpty(),
  body('state').notEmpty(),
], createProperty);

router.put('/:id', authenticate, authorize('broker', 'builder', 'admin'), updateProperty);

module.exports = router;
