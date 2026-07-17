import { PrismaClient } from '@prisma/client';
import { supabase, isRealSupabase } from '../supabase.js';

const prisma = new PrismaClient();

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If we are in Dev Bypass Mode, let them pass with a mock user
      if (!isRealSupabase) {
        req.user = await getOrCreateMockUser();
        return next();
      }
      return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    if (!isRealSupabase) {
      // Dev Bypass Mode allows passing any token
      req.user = await getOrCreateMockUser();
      return next();
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    // Ensure user exists in our local DB
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email },
      create: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
      },
    });

    req.user = dbUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({ error: 'Internal authentication error' });
  }
};

async function getOrCreateMockUser() {
  const mockId = '00000000-0000-0000-0000-000000000000';
  return await prisma.user.upsert({
    where: { id: mockId },
    update: {},
    create: {
      id: mockId,
      email: 'dev@example.com',
      name: 'Local Developer',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });
}
