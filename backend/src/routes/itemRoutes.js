const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadItem,
  getAllItems,
  getItem,
  updateItem,
  deleteItem,
  conversationalSearch,
  recordGift,
} = require('../controllers/itemController');

// Upload new item with photos
router.post('/upload', upload.array('photos', 10), uploadItem);

// Get all items (with optional filters)
router.get('/', getAllItems);

// Get single item
router.get('/:id', getItem);

// Update item
router.put('/:id', updateItem);

// Delete item
router.delete('/:id', deleteItem);

// Conversational search
router.post('/search', conversationalSearch);

// Record gift
router.post('/:id/gift', recordGift);

module.exports = router;
