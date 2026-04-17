const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const env = require('../../config/env');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} = require('../../utils/errorTypes');
const logger = require('../../utils/logger');

class AuthService {
  async register(name, email, password, role = 'user') {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        role,
      });

      await user.save();
      logger.success(`User registered: ${email}`);

      // Generate token
      const token = this.generateToken(user._id, user.email, user.role);
      return {
        user: user.toJSON(),
        token,
      };
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      throw new ValidationError(error.message || 'Registration failed');
    }
  }

  async login(email, password) {
    try {
      // Validate input
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      logger.success(`User logged in: ${email}`);

      // Generate token
      const token = this.generateToken(user._id, user.email, user.role);
      return {
        user: user.toJSON(),
        token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ValidationError) {
        throw error;
      }
      throw new UnauthorizedError('Login failed');
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return user.toJSON();
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new UnauthorizedError('Failed to fetch user');
    }
  }

  generateToken(userId, email, role) {
    return jwt.sign(
      {
        id: userId,
        email,
        role,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRY,
      }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}

module.exports = new AuthService();
