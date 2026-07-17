import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to generate a unique short slug for dynamic redirects
const generateShortSlug = async () => {
  while (true) {
    const slug = crypto.randomBytes(4).toString('hex').slice(0, 7); // 7 chars
    const existing = await prisma.qRCode.findUnique({
      where: { shortUrl: slug },
    });
    if (!existing) return slug;
  }
};

export const getQRs = async (req, res, next) => {
  try {
    const qrs = await prisma.qRCode.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { scans: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse config and data back into JSON objects
    const parsedQRs = qrs.map(qr => ({
      ...qr,
      config: JSON.parse(qr.config),
      data: JSON.parse(qr.data),
      scanCount: qr._count.scans,
    }));

    res.status(200).json({ qrs: parsedQRs });
  } catch (error) {
    next(error);
  }
};

export const createQR = async (req, res, next) => {
  try {
    const { name, type, isDynamic } = req.body;
    let configObj = req.body.config ? JSON.parse(req.body.config) : {};
    let dataObj = req.body.data ? JSON.parse(req.body.data) : {};

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and Type are required fields' });
    }

    const userId = req.user.id;

    // Handle file uploads (such as PDF, Image, Video, or QR Logo)
    if (req.files) {
      // Main content file (PDF/Image/Video)
      if (req.files.file && req.files.file[0]) {
        dataObj.fileUrl = `/uploads/${req.files.file[0].filename}`;
        dataObj.originalName = req.files.file[0].originalname;
        dataObj.fileSize = req.files.file[0].size;
      }
      // Logo overlay image
      if (req.files.logo && req.files.logo[0]) {
        configObj.logoUrl = `/uploads/${req.files.logo[0].filename}`;
      }
    }

    let shortUrl = null;
    const isDynamicBool = isDynamic === 'true' || isDynamic === true;

    // Generate redirect slug if dynamic QR
    if (isDynamicBool) {
      shortUrl = await generateShortSlug();
    }

    const qr = await prisma.qRCode.create({
      data: {
        userId,
        name,
        type,
        isDynamic: isDynamicBool,
        shortUrl,
        config: JSON.stringify(configObj),
        data: JSON.stringify(dataObj),
      },
    });

    res.status(201).json({
      message: 'QR Code created successfully',
      qr: {
        ...qr,
        config: configObj,
        data: dataObj,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateQR = async (req, res, next) => {
  const { id } = req.params;
  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: { id },
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code not found' });
    }

    if (qrCode.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this QR code' });
    }

    const { name } = req.body;
    let configObj = req.body.config ? JSON.parse(req.body.config) : JSON.parse(qrCode.config);
    let dataObj = req.body.data ? JSON.parse(req.body.data) : JSON.parse(qrCode.data);

    // Handle files uploads for updates
    if (req.files) {
      if (req.files.file && req.files.file[0]) {
        dataObj.fileUrl = `/uploads/${req.files.file[0].filename}`;
        dataObj.originalName = req.files.file[0].originalname;
        dataObj.fileSize = req.files.file[0].size;
      }
      if (req.files.logo && req.files.logo[0]) {
        configObj.logoUrl = `/uploads/${req.files.logo[0].filename}`;
      }
    }

    const updated = await prisma.qRCode.update({
      where: { id },
      data: {
        name: name || qrCode.name,
        config: JSON.stringify(configObj),
        data: JSON.stringify(dataObj),
      },
    });

    res.status(200).json({
      message: 'QR Code updated successfully',
      qr: {
        ...updated,
        config: configObj,
        data: dataObj,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQR = async (req, res, next) => {
  const { id } = req.params;
  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: { id },
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code not found' });
    }

    if (qrCode.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this QR code' });
    }

    await prisma.qRCode.delete({
      where: { id },
    });

    res.status(200).json({ message: 'QR Code deleted successfully' });
  } catch (error) {
    next(error);
  }
};
