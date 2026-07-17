import { PrismaClient } from '@prisma/client';
import { supabase, isRealSupabase } from '../supabase.js';

const prisma = new PrismaClient();

export const getProfile = async (req, res, next) => {
  try {
    // req.user is already fetched in authMiddleware
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  const { name, password } = req.body;
  const avatarFile = req.file;

  try {
    const userId = req.user.id;
    let avatarUrl = req.user.avatarUrl;

    // Handle avatar upload
    if (avatarFile) {
      avatarUrl = `/uploads/${avatarFile.filename}`;
    }

    // Update local database fields (name, avatarUrl)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : req.user.name,
        avatarUrl,
      },
    });

    // If password change is requested
    if (password) {
      if (isRealSupabase) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          return res.status(400).json({ error: `Failed to update password: ${error.message}` });
        }
      } else {
        console.log(`[Dev Bypass] Password update simulated for user ${userId}`);
      }
    }

    // If name change is requested and we are in Supabase, update it in auth metadata as well
    if (name && isRealSupabase) {
      await supabase.auth.updateUser({
        data: { full_name: name },
      });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
