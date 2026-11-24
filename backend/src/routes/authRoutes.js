import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 60 }).withMessage('Name is too long.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
], validate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: normalizedEmail, password: hashedPassword });
    res.status(201).json({
      token: makeToken(user._id),
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) { next(error); }
});

router.post('/login', [
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.')
], validate, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
    const valid = user && await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(401).json({ message: 'Incorrect email or password.' });
    res.json({
      token: makeToken(user._id),
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) { next(error); }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('name email');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

export default router;
