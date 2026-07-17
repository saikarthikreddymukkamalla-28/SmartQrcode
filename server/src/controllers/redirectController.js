import { PrismaClient } from '@prisma/client';
import useragent from 'useragent';

const prisma = new PrismaClient();

export const handleRedirect = async (req, res, next) => {
  const { shortUrl } = req.params;
  try {
    const qr = await prisma.qRCode.findUnique({
      where: { shortUrl },
    });

    if (!qr) {
      return res.status(404).send('<h1>QR Code Not Found</h1><p>The link you scanned is invalid or has been deleted.</p>');
    }

    const dataObj = JSON.parse(qr.data);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const serverUrl = `${req.protocol}://${req.get('host')}`;

    // 1. Log scan analytics asynchronously
    const uaString = req.headers['user-agent'] || '';
    const agent = useragent.parse(uaString);
    
    let device = 'desktop';
    if (/tablet|ipad|playbook|silk/i.test(uaString)) {
      device = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(uaString)) {
      device = 'mobile';
    }

    const browser = agent.family;
    const os = agent.os.family;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    // Log the scan
    prisma.scan.create({
      data: {
        qrCodeId: qr.id,
        ip: typeof ip === 'string' ? ip.split(',')[0].trim() : ip,
        userAgent: uaString.substring(0, 255),
        device,
        browser,
        os,
        // Country and city could be enriched via IP lookup, leaving empty or using headers
        country: req.headers['cf-ipcountry'] || 'Unknown', 
      },
    }).catch(err => console.error('Error logging scan analytics:', err.message));

    // 2. Determine redirection destination based on type
    let redirectDestination = '/';

    switch (qr.type) {
      case 'website':
        redirectDestination = dataObj.url;
        break;

      case 'whatsapp':
        // Format: https://wa.me/number?text=message
        const waMsg = dataObj.message ? encodeURIComponent(dataObj.message) : '';
        redirectDestination = `https://wa.me/${dataObj.phone}?text=${waMsg}`;
        break;

      case 'phone':
        redirectDestination = `tel:${dataObj.phone}`;
        break;

      case 'email':
        const mailSubject = dataObj.subject ? encodeURIComponent(dataObj.subject) : '';
        const mailBody = dataObj.body ? encodeURIComponent(dataObj.body) : '';
        redirectDestination = `mailto:${dataObj.email}?subject=${mailSubject}&body=${mailBody}`;
        break;

      case 'sms':
        const smsBody = dataObj.message ? encodeURIComponent(dataObj.message) : '';
        redirectDestination = `sms:${dataObj.phone}?body=${smsBody}`;
        break;

      case 'maps':
        // Latitude, Longitude or Address query
        if (dataObj.latitude && dataObj.longitude) {
          redirectDestination = `https://www.google.com/maps/search/?api=1&query=${dataObj.latitude},${dataObj.longitude}`;
        } else if (dataObj.address) {
          redirectDestination = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dataObj.address)}`;
        }
        break;

      case 'upi':
        // Standard UPI Deep link format
        const upiName = dataObj.name ? encodeURIComponent(dataObj.name) : '';
        const upiNote = dataObj.note ? encodeURIComponent(dataObj.note) : '';
        const upiAmount = dataObj.amount ? `&am=${dataObj.amount}` : '';
        redirectDestination = `upi://pay?pa=${dataObj.upiId}&pn=${upiName}&tn=${upiNote}${upiAmount}&cu=INR`;
        break;

      case 'pdf':
      case 'image':
      case 'video':
        // Redirect to the uploaded file served statically
        if (dataObj.fileUrl) {
          redirectDestination = dataObj.fileUrl.startsWith('http') 
            ? dataObj.fileUrl 
            : `${serverUrl}${dataObj.fileUrl}`;
        }
        break;

      case 'vcard':
        // Redirect to the public client digital business card landing page (Read-only)
        redirectDestination = `${clientUrl}/vcard/${qr.id}`;
        break;

      case 'multilink':
        // Redirect to the public client multi-link page (Read-only)
        redirectDestination = `${clientUrl}/multilink/${qr.id}`;
        break;

      default:
        redirectDestination = clientUrl;
    }

    // Ensure URL has protocol if it is an external link (like website)
    if (['website', 'whatsapp'].includes(qr.type) && !/^https?:\/\//i.test(redirectDestination)) {
      redirectDestination = `https://${redirectDestination}`;
    }

    // Perform the 302 redirection
    res.redirect(302, redirectDestination);
  } catch (error) {
    next(error);
  }
};

export const getPublicQRData = async (req, res, next) => {
  const { id } = req.params;
  try {
    const qr = await prisma.qRCode.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        config: true,
        data: true,
      },
    });

    if (!qr) {
      return res.status(404).json({ error: 'QR Code not found' });
    }

    res.status(200).json({
      qr: {
        ...qr,
        config: JSON.parse(qr.config),
        data: JSON.parse(qr.data),
      },
    });
  } catch (error) {
    next(error);
  }
};
