import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getQRAnalytics = async (req, res, next) => {
  const { id } = req.params;
  try {
    // 1. Ownership validation
    const qr = await prisma.qRCode.findUnique({
      where: { id },
    });

    if (!qr) {
      return res.status(404).json({ error: 'QR Code not found' });
    }

    if (qr.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this QR code' });
    }

    // 2. Fetch all scans for this QR code
    const scans = await prisma.scan.findMany({
      where: { qrCodeId: id },
      orderBy: { scannedAt: 'desc' },
    });

    // 3. Aggregate total scan count
    const totalScans = scans.length;

    // 4. Aggregate scans by date (last 30 days)
    const scanHistory = {};
    // Pre-populate last 7 days with 0s to make the chart look nice even with low data
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      scanHistory[dateString] = 0;
    }

    scans.forEach(scan => {
      const dateString = scan.scannedAt.toISOString().split('T')[0];
      if (scanHistory[dateString] !== undefined) {
        scanHistory[dateString]++;
      } else {
        // If within 30 days, we track it
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (scan.scannedAt >= thirtyDaysAgo) {
          scanHistory[dateString] = 1;
        }
      }
    });

    const historyData = Object.entries(scanHistory)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 5. Aggregate device distributions
    const devices = {};
    scans.forEach(scan => {
      const d = scan.device || 'desktop';
      devices[d] = (devices[d] || 0) + 1;
    });
    const deviceData = Object.entries(devices).map(([name, value]) => ({ name, value }));

    // 6. Aggregate OS distributions
    const osList = {};
    scans.forEach(scan => {
      const os = scan.os || 'Unknown';
      osList[os] = (osList[os] || 0) + 1;
    });
    const osData = Object.entries(osList).map(([name, value]) => ({ name, value }));

    // 7. Aggregate Browser distributions
    const browsers = {};
    scans.forEach(scan => {
      const b = scan.browser || 'Unknown';
      browsers[b] = (browsers[b] || 0) + 1;
    });
    const browserData = Object.entries(browsers).map(([name, value]) => ({ name, value }));

    // 8. Recent scans details (last 10)
    const recentScans = scans.slice(0, 10).map(scan => ({
      id: scan.id,
      ip: scan.ip ? `${scan.ip.slice(0, 6)}...` : 'Unknown', // anonymize IP
      device: scan.device,
      browser: scan.browser,
      os: scan.os,
      country: scan.country,
      scannedAt: scan.scannedAt,
    }));

    res.status(200).json({
      analytics: {
        totalScans,
        history: historyData,
        devices: deviceData,
        os: osData,
        browsers: browserData,
        recentScans,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard analytics aggregator
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all QR codes for user
    const qrs = await prisma.qRCode.findMany({
      where: { userId },
      select: {
        id: true,
        isDynamic: true,
        _count: {
          select: { scans: true },
        },
      },
    });

    const totalQRs = qrs.length;
    const dynamicQRs = qrs.filter(qr => qr.isDynamic).length;
    const staticQRs = totalQRs - dynamicQRs;
    const totalScans = qrs.reduce((acc, qr) => acc + qr._count.scans, 0);

    // Get 5 most recent scans across all QR codes
    const recentScans = await prisma.scan.findMany({
      where: {
        qrCode: {
          userId,
        },
      },
      include: {
        qrCode: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { scannedAt: 'desc' },
      take: 5,
    });

    res.status(200).json({
      summary: {
        totalQRs,
        dynamicQRs,
        staticQRs,
        totalScans,
        recentScans: recentScans.map(scan => ({
          id: scan.id,
          qrName: scan.qrCode.name,
          qrType: scan.qrCode.type,
          device: scan.device,
          country: scan.country,
          scannedAt: scan.scannedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
