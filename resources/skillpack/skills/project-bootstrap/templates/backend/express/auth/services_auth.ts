/**
 * Authentication service.
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import type { User, UserPayload, RegisterRequest } from '../types/auth';

// In-memory user store (replace with database in production)
const users: Map<string, User> = new Map();

export const authService = {
  /**
   * Hash a password.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, authConfig.bcryptRounds);
  },

  /**
   * Verify a password against a hash.
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Create a JWT token.
   */
  createToken(payload: UserPayload): string {
    return jwt.sign(payload, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn,
    });
  },

  /**
   * Verify a JWT token.
   */
  verifyToken(token: string): UserPayload | null {
    try {
      return jwt.verify(token, authConfig.jwtSecret) as UserPayload;
    } catch {
      return null;
    }
  },

  /**
   * Find user by email.
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return Array.from(users.values()).find((u) => u.email === email);
  },

  /**
   * Find user by ID.
   */
  async findById(id: string): Promise<User | undefined> {
    return users.get(id);
  },

  /**
   * Create a new user.
   */
  async createUser(data: RegisterRequest): Promise<User> {
    const id = crypto.randomUUID();
    const hashedPassword = await this.hashPassword(data.password);

    const user: User = {
      id,
      email: data.email,
      password: hashedPassword,
      name: data.name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.set(id, user);
    return user;
  },

  /**
   * Update user password.
   */
  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const user = users.get(userId);
    if (!user) return false;

    user.password = await this.hashPassword(newPassword);
    user.updatedAt = new Date();
    return true;
  },

  /**
   * Update user profile.
   */
  async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    const user = users.get(userId);
    if (!user) return null;

    if (data.name !== undefined) user.name = data.name;
    user.updatedAt = new Date();

    return user;
  },

  /**
   * Deactivate user (soft delete).
   */
  async deactivateUser(userId: string): Promise<boolean> {
    const user = users.get(userId);
    if (!user) return false;

    user.isActive = false;
    user.updatedAt = new Date();
    return true;
  },

  /**
   * Authenticate user with email and password.
   */
  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.isActive) return null;

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) return null;

    return user;
  },
};

export default authService;
