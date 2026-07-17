import { PrismaClient } from '@prisma/client';
import { supabase, isRealSupabase } from '../supabase.js';

const prisma = new PrismaClient();

export const register = async (req, res, next) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    if (!isRealSupabase) {
      // Mock registration
      const mockId = '00000000-0000-0000-0000-000000000000';
      const dbUser = await prisma.user.upsert({
        where: { id: mockId },
        update: { name: name || 'Local Developer' },
        create: {
          id: mockId,
          email: email,
          name: name || 'Local Developer',
        },
      });

      return res.status(200).json({
        message: 'Mock registration successful',
        session: {
          access_token: 'mock-dev-token-jwt',
          user: dbUser,
        },
      });
    }

    // Call Supabase SignUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0],
        },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const supabaseUser = data.user;
    if (!supabaseUser) {
      return res.status(400).json({ error: 'Failed to create user account' });
    }

    // Create record in our database
    const dbUser = await prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: { email: supabaseUser.email },
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: name || supabaseUser.email.split('@')[0],
      },
    });

    res.status(200).json({
      message: 'Registration successful',
      session: {
        access_token: data.session?.access_token || null,
        user: dbUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    if (!isRealSupabase) {
      // Mock login
      const dbUser = await prisma.user.findFirst({
        where: { email },
      }) || await prisma.user.upsert({
        where: { id: '00000000-0000-0000-0000-000000000000' },
        update: { email },
        create: {
          id: '00000000-0000-0000-0000-000000000000',
          email,
          name: email.split('@')[0],
        },
      });

      return res.status(200).json({
        message: 'Mock login successful',
        session: {
          access_token: 'mock-dev-token-jwt',
          user: dbUser,
        },
      });
    }

    // Call Supabase SignIn
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Sync to local DB to ensure consistency
    const dbUser = await prisma.user.upsert({
      where: { id: data.user.id },
      update: { email: data.user.email },
      create: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
      },
    });

    res.status(200).json({
      message: 'Login successful',
      session: {
        access_token: data.session.access_token,
        user: dbUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
