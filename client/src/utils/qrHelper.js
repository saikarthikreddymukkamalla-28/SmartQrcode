import QRCode from 'qrcode';

/**
 * Renders a custom QR Code onto a canvas element.
 * @param {HTMLCanvasElement} canvas The canvas element to render onto.
 * @param {string} text The payload text to encode.
 * @param {object} options Customization options (foregroundColor, backgroundColor, margin, width).
 * @param {string|File|null} logo The logo URL or file to render as overlay.
 */
export const renderQRCode = (canvas, text, options = {}, logo = null) => {
  if (!canvas || !text) return;

  const qrWidth = options.width || 300;
  const qrOptions = {
    width: qrWidth,
    margin: options.margin !== undefined ? options.margin : 2,
    color: {
      dark: options.foregroundColor || '#0f172a', // Charcoal default
      light: options.backgroundColor || '#ffffff', // White default
    },
    errorCorrectionLevel: 'H', // Required high recovery to support central logo overlays
  };

  QRCode.toCanvas(canvas, text, qrOptions, (err) => {
    if (err) {
      console.error('Error generating QR code:', err);
      return;
    }

    if (logo) {
      const ctx = canvas.getContext('2d');
      const logoImg = new Image();
      
      // Determine logo source URL
      const logoSrc = typeof logo === 'string' 
        ? logo 
        : URL.createObjectURL(logo);

      logoImg.src = logoSrc;
      logoImg.onload = () => {
        const logoSize = qrWidth * 0.22; // 22% of QR width
        const x = (qrWidth - logoSize) / 2;
        const y = (qrWidth - logoSize) / 2;

        // 1. Draw solid background under logo to clean up overlapping QR dots
        ctx.fillStyle = qrOptions.color.light;
        ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);

        // 2. Draw outer border round the logo container
        ctx.strokeStyle = options.foregroundColor || '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 4, y - 4, logoSize + 8, logoSize + 8);

        // 3. Draw logo image
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        
        // Clean up object URL if it was created dynamically
        if (typeof logo !== 'string') {
          URL.revokeObjectURL(logoSrc);
        }
      };
    }
  });
};

/**
 * Downloads a canvas element as an image.
 * @param {HTMLCanvasElement} canvas The canvas to export.
 * @param {string} filename Output file name.
 * @param {string} format 'png' | 'svg' | 'pdf'
 * @param {string} payloadText Used for generating SVG or PDF content directly.
 * @param {object} qrConfig Config details.
 */
export const downloadQRCode = async (canvas, filename, format = 'png', payloadText = '', qrConfig = {}) => {
  if (!canvas) return;

  if (format === 'png') {
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return;
  }

  if (format === 'svg') {
    // Generate SVG via QRCode library dynamically
    try {
      const svgOptions = {
        margin: qrConfig.margin !== undefined ? qrConfig.margin : 2,
        color: {
          dark: qrConfig.foregroundColor || '#0f172a',
          light: qrConfig.backgroundColor || '#ffffff',
        },
        errorCorrectionLevel: 'H',
      };
      
      const svgString = await QRCode.toString(payloadText, { ...svgOptions, type: 'svg' });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filename}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting SVG:', err);
    }
    return;
  }

  if (format === 'pdf') {
    // Dynamically load jsPDF client-side using external script or canvas capture
    // Standard canvas drawing inside a PDF document works beautifully!
    try {
      // We will export the canvas as a base64 PNG and insert it into a PDF
      const imgData = canvas.toDataURL('image/png');
      
      // Since installing jsPDF might take extra bandwidth, we can build a lightweight
      // PDF document using a Blob or just download the canvas wrapped in a clean print container.
      // Alternatively, we can let jsPDF load dynamically from a CDN if needed.
      // For standard pure browser download, let's create a beautiful print window/container
      // that prints the QR page, or load jsPDF dynamically.
      // Let's implement dynamic CDN load of jsPDF!
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(16);
      pdf.text('Qube QR Code Export', 105, 40, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Filename: ${filename}`, 105, 48, { align: 'center' });
      pdf.text(`Payload: ${payloadText}`, 105, 54, { align: 'center', maxWidth: 160 });
      
      // Center the 100x100mm QR code image on A4 page (A4 width=210, height=297)
      pdf.addImage(imgData, 'PNG', 55, 70, 100, 100);
      
      pdf.text('Scanned using Qube Platform', 105, 190, { align: 'center' });
      
      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback: print the page or direct user
      alert('Could not generate PDF. Please try PNG export.');
    }
  }
};
