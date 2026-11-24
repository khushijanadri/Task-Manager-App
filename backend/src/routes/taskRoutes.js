import { Router } from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

const taskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required.').isLength({ max: 120 }).withMessage('Title must be 120 characters or fewer.'),
  body('description').optional({ nullable: true }).isLength({ max: 1000 }).withMessage('Description must be 1000 characters or fewer.'),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status.'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority.'),
  body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Due date must be a valid date.')
];

router.get('/stats', async (req, res, next) => {
  try {
    const [total, pending, inProgress, completed] = await Promise.all([
      Task.countDocuments({ user: req.userId }),
      Task.countDocuments({ user: req.userId, status: 'Pending' }),
      Task.countDocuments({ user: req.userId, status: 'In Progress' }),
      Task.countDocuments({ user: req.userId, status: 'Completed' })
    ]);
    res.json({ total, pending, inProgress, completed });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = { user: req.userId };
    if (['Pending', 'In Progress', 'Completed'].includes(req.query.status)) filter.status = req.query.status;
    if (['Low', 'Medium', 'High'].includes(req.query.priority)) filter.priority = req.query.priority;
    if (req.query.search) filter.title = { $regex: req.query.search.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (error) { next(error); }
});

router.post('/', taskRules, validate, async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, user: req.userId });
    res.status(201).json({ task });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task ID.' });
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ task });
  } catch (error) { next(error); }
});

router.put('/:id', [
  body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty.').isLength({ max: 120 }),
  body('description').optional({ nullable: true }).isLength({ max: 1000 }),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed']),
  body('priority').optional().isIn(['Low', 'Medium', 'High']),
  body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601()
], validate, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task ID.' });
    const allowed = ['title', 'description', 'status', 'priority', 'dueDate'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ task });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task ID.' });
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) { next(error); }
});

export default router;
