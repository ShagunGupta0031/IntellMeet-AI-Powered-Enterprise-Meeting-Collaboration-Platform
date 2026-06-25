const express = require('express');
const { updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
