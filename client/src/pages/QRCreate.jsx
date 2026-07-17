import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQR } from '../services/qr.js';
import { renderQRCode } from '../utils/qrHelper.js';
import { 
  Globe, 
  MessageSquare, 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  CreditCard, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Contact, 
  ListPlus, 
  Sparkles,
  ArrowLeft,
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';

const QR_TYPES = [
  { id: 'website', name: 'Website URL', icon: Globe, desc: 'Link to any website or landing page.' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, desc: 'Start a WhatsApp conversation with a pre-filled message.' },
  { id: 'phone', name: 'Phone', icon: Phone, desc: 'Prompt to dial a phone number.' },
  { id: 'email', name: 'Email', icon: Mail, desc: 'Send an email with a prefilled subject and body.' },
  { id: 'sms', name: 'SMS', icon: MessageCircle, desc: 'Send a pre-formatted text message.' },
  { id: 'maps', name: 'Google Maps', icon: MapPin, desc: 'Open Google Maps at specific coordinates or address.' },
  { id: 'upi', name: 'UPI Payment', icon: CreditCard, desc: 'Receive payments via UPI (India).' },
  { id: 'pdf', name: 'PDF Document', icon: FileText, desc: 'Host a PDF that opens instantly when scanned.' },
  { id: 'image', name: 'Image File', icon: ImageIcon, desc: 'Display a hosted image.' },
  { id: 'video', name: 'Video File', icon: Video, desc: 'Stream a hosted video.' },
  { id: 'vcard', name: 'Digital Business Card', icon: Contact, desc: 'Create a beautiful read-only contact profile.' },
  { id: 'multilink', name: 'Multi-Link Page', icon: ListPlus, desc: 'A landing page containing list of social links.' },
];

const QRCreate = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Core Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('website');
  const [isDynamic, setIsDynamic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // QR Content states (type-specific)
  const [url, setUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [upiNote, setUpiNote] = useState('');
  
  // File Upload (PDF, Image, Video)
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Digital Business Card (vCard)
  const [vCard, setVCard] = useState({
    firstName: '', lastName: '', organization: '', title: '',
    phone: '', email: '', website: '', address: '',
    twitter: '', linkedin: '', github: ''
  });

  // Multi-Link states
  const [links, setLinks] = useState([{ title: 'Website', url: '' }]);

  // Customization styling states
  const [foregroundColor, setForegroundColor] = useState('#0f172a');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [margin, setMargin] = useState(2);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);

  // Update QR preview on configuration changes
  useEffect(() => {
    let payload = 'https://qube-qr.com'; // Fallback preview text

    if (isDynamic) {
      // Dynamic QRs route through the server redirection endpoint
      payload = 'http://localhost:5000/r/placeholder';
    } else {
      // Static QRs encode data directly
      switch (type) {
        case 'website':
          payload = url || 'https://google.com';
          break;
        case 'whatsapp':
          payload = `https://wa.me/${phone || '000000'}?text=${encodeURIComponent(message)}`;
          break;
        case 'phone':
          payload = `tel:${phone || '000000'}`;
          break;
        case 'email':
          payload = `mailto:${email || 'dev@example.com'}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          break;
        case 'sms':
          payload = `sms:${phone || '000000'}?body=${encodeURIComponent(message)}`;
          break;
        case 'maps':
          if (latitude && longitude) {
            payload = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          } else {
            payload = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || 'New York')}`;
          }
          break;
        case 'upi':
          payload = `upi://pay?pa=${upiId || 'test@upi'}&pn=${encodeURIComponent(upiName || 'Merchant')}&tn=${encodeURIComponent(upiNote)}&am=${upiAmount}&cu=INR`;
          break;
        default:
          payload = `https://qube-qr.com/public/${type}`;
      }
    }

    renderQRCode(
      canvasRef.current,
      payload,
      { foregroundColor, backgroundColor, margin, width: 300 },
      logoFile
    );
  }, [
    type, isDynamic, url, phone, message, email, subject, body, 
    latitude, longitude, address, upiId, upiName, upiAmount, upiNote,
    foregroundColor, backgroundColor, margin, logoFile
  ]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreviewUrl(null);
  };

  const handleAddLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const handleRemoveLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index, field, value) => {
    const updated = [...links];
    updated[index][field] = value;
    setLinks(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a name for your QR code.');
      return;
    }

    // PDF, Image, Video validation
    if (['pdf', 'image', 'video'].includes(type) && !selectedFile) {
      setError(`Please upload a ${type.toUpperCase()} file to generate the QR code.`);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('type', type);
      formData.append('isDynamic', isDynamic);

      // Serialize configurations
      const config = {
        foregroundColor,
        backgroundColor,
        margin
      };
      formData.append('config', JSON.stringify(config));

      // Formulate type-specific data
      let data = {};
      switch (type) {
        case 'website':
          data = { url };
          break;
        case 'whatsapp':
          data = { phone, message };
          break;
        case 'phone':
          data = { phone };
          break;
        case 'email':
          data = { email, subject, body };
          break;
        case 'sms':
          data = { phone, message };
          break;
        case 'maps':
          data = { latitude, longitude, address };
          break;
        case 'upi':
          data = { upiId, name: upiName, amount: upiAmount, note: upiNote };
          break;
        case 'vcard':
          data = vCard;
          break;
        case 'multilink':
          data = { links: links.filter(l => l.title && l.url) };
          break;
        default:
          break;
      }
      formData.append('data', JSON.stringify(data));

      // Append upload files
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await createQR(formData);
      
      // Delighted success feedback
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-lg">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-xs">
        <button onClick={() => navigate('/')} className="p-sm text-brand-500 hover:text-brand-900 rounded-lg hover:bg-brand-100 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-xs text-brand-400">QR Manager /</span>
          <h1 className="text-xl font-bold text-brand-900 leading-none mt-1">Generate QR Code</h1>
        </div>
      </div>

      {error && (
        <div className="p-sm bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Left Side: Parameters Settings (col-span-2) */}
        <div className="lg:col-span-2 space-y-lg">
          
          {/* Step 1: Core details */}
          <div className="card-premium p-lg space-y-md">
            <h3 className="text-sm font-semibold text-brand-900 border-b border-brand-100 pb-sm">1. Name & Dynamic Routing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">
                  QR Code Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Cafe Menu, Company LinkedIn"
                  className="input-premium"
                />
              </div>

              {/* Dynamic Toggle Card */}
              <div className="flex items-center justify-between p-sm border border-brand-200 rounded-lg bg-brand-50/50 hover:bg-brand-50 transition-colors">
                <div>
                  <span className="text-xs font-semibold text-brand-800">Dynamic QR</span>
                  <p className="text-[9px] text-brand-400">Allows target updates later.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isDynamic}
                  onChange={(e) => {
                    setIsDynamic(e.target.checked);
                    // PDFs, Images, Videos, Multi-Links and vCards MUST be Dynamic
                    if (!e.target.checked && ['pdf', 'image', 'video', 'vcard', 'multilink'].includes(type)) {
                      setType('website');
                    }
                  }}
                  className="w-4 h-4 rounded text-brand-900 focus:ring-brand-900 border-brand-300"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Select Type */}
          <div className="card-premium p-lg space-y-md">
            <h3 className="text-sm font-semibold text-brand-900 border-b border-brand-100 pb-sm">2. Select Destination Type</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
              {QR_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                // Files, Digital Card and Multi-link require dynamic route
                const isDisabled = !isDynamic && ['pdf', 'image', 'video', 'vcard', 'multilink'].includes(t.id);

                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setType(t.id)}
                    className={`flex flex-col items-center justify-center p-md border rounded-xl text-center group transition-all duration-150 ${
                      isSelected
                        ? 'border-brand-900 bg-brand-900 text-white shadow-premium'
                        : isDisabled
                          ? 'border-brand-100 bg-brand-50/50 opacity-40 cursor-not-allowed'
                          : 'border-brand-200 hover:border-brand-300 hover:bg-brand-50/50 text-brand-700'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? 'text-white' : 'text-brand-500 group-hover:text-brand-900'} />
                    <span className="text-[11px] font-semibold mt-xs">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Type specific inputs */}
          <div className="card-premium p-lg space-y-md">
            <h3 className="text-sm font-semibold text-brand-900 border-b border-brand-100 pb-sm">3. Configure Content Data</h3>
            
            {/* WEBSITE INPUTS */}
            {type === 'website' && (
              <div>
                <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Website URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/menu"
                  className="input-premium"
                />
              </div>
            )}

            {/* WHATSAPP INPUTS */}
            {type === 'whatsapp' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">WhatsApp Number (inc. Country Code)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., 919876543210"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Pre-filled Message</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., Hello, I would like to book a table."
                    className="input-premium"
                  />
                </div>
              </div>
            )}

            {/* PHONE INPUTS */}
            {type === 'phone' && (
              <div>
                <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +15550199"
                  className="input-premium"
                />
              </div>
            )}

            {/* EMAIL INPUTS */}
            {type === 'email' && (
              <div className="space-y-md">
                <div>
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Recipient Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="orders@cafe.com"
                    className="input-premium"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Inquiry"
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Email Body</label>
                    <input
                      type="text"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="e.g., Hi, sending from QR scan"
                      className="input-premium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SMS INPUTS */}
            {type === 'sms' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Recipient Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +15550199"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Text Message Body</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., Send Promo Code"
                    className="input-premium"
                  />
                </div>
              </div>
            )}

            {/* MAPS INPUTS */}
            {type === 'maps' && (
              <div className="space-y-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Latitude (Optional)</label>
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="e.g., 40.7128"
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Longitude (Optional)</label>
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="e.g., -74.0060"
                      className="input-premium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Address Search (Required if Coordinates are blank)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 1600 Amphitheatre Pkwy, Mountain View, CA"
                    className="input-premium"
                  />
                </div>
              </div>
            )}

            {/* UPI PAYMENT INPUTS */}
            {type === 'upi' && (
              <div className="space-y-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">UPI Address / VPA</label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g., merchant@bank"
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Payee Name</label>
                    <input
                      type="text"
                      required
                      value={upiName}
                      onChange={(e) => setUpiName(e.target.value)}
                      placeholder="e.g., Cafe Central"
                      className="input-premium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Amount (INR) (Optional)</label>
                    <input
                      type="number"
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                      placeholder="e.g., 250"
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Transaction Note (Optional)</label>
                    <input
                      type="text"
                      value={upiNote}
                      onChange={(e) => setUpiNote(e.target.value)}
                      placeholder="e.g., Bill Payment"
                      className="input-premium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FILE UPLOAD (PDF, IMAGE, VIDEO) */}
            {['pdf', 'image', 'video'].includes(type) && (
              <div className="space-y-md">
                <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider">
                  Upload {type.toUpperCase()} File
                </label>
                <div className="border-2 border-dashed border-brand-200 hover:border-brand-900 rounded-xl p-xl transition-colors text-center relative bg-brand-50/20">
                  <input
                    type="file"
                    required
                    accept={type === 'pdf' ? '.pdf' : type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-xs">
                    <Upload className="text-brand-400" size={24} />
                    <span className="text-xs font-medium text-brand-700">
                      {selectedFile ? selectedFile.name : `Drag & drop or click to select a ${type.toUpperCase()} file`}
                    </span>
                    <span className="text-[10px] text-brand-400">
                      {selectedFile ? `${Math.round(selectedFile.size / 1024 / 1024 * 10) / 10} MB` : 'Max size: 50MB'}
                    </span>
                  </div>
                </div>

                {filePreview && (
                  <div className="mt-md border border-brand-100 rounded-lg p-sm bg-white flex justify-center max-h-32 overflow-hidden">
                    <img src={filePreview} alt="Preview" className="object-contain h-24 rounded" />
                  </div>
                )}
              </div>
            )}

            {/* DIGITAL BUSINESS CARD (vCARD) */}
            {type === 'vcard' && (
              <div className="space-y-md">
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">First Name</label>
                    <input
                      type="text"
                      required
                      value={vCard.firstName}
                      onChange={(e) => setVCard({...vCard, firstName: e.target.value})}
                      placeholder="Jane"
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Last Name</label>
                    <input
                      type="text"
                      required
                      value={vCard.lastName}
                      onChange={(e) => setVCard({...vCard, lastName: e.target.value})}
                      placeholder="Doe"
                      className="input-premium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Company</label>
                    <input
                      type="text"
                      value={vCard.organization}
                      onChange={(e) => setVCard({...vCard, organization: e.target.value})}
                      placeholder="Acme Corp"
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Job Title</label>
                    <input
                      type="text"
                      value={vCard.title}
                      onChange={(e) => setVCard({...vCard, title: e.target.value})}
                      placeholder="Senior Designer"
                      className="input-premium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Direct Phone</label>
                    <input
                      type="tel"
                      value={vCard.phone}
                      onChange={(e) => setVCard({...vCard, phone: e.target.value})}
                      placeholder="+15550199"
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Work Email</label>
                    <input
                      type="email"
                      value={vCard.email}
                      onChange={(e) => setVCard({...vCard, email: e.target.value})}
                      placeholder="jane@acme.com"
                      className="input-premium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Location / Address</label>
                  <input
                    type="text"
                    value={vCard.address}
                    onChange={(e) => setVCard({...vCard, address: e.target.value})}
                    placeholder="San Francisco, CA"
                    className="input-premium"
                  />
                </div>
                <div className="grid grid-cols-3 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">LinkedIn</label>
                    <input
                      type="text"
                      value={vCard.linkedin}
                      onChange={(e) => setVCard({...vCard, linkedin: e.target.value})}
                      placeholder="username"
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">GitHub</label>
                    <input
                      type="text"
                      value={vCard.github}
                      onChange={(e) => setVCard({...vCard, github: e.target.value})}
                      placeholder="username"
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Twitter</label>
                    <input
                      type="text"
                      value={vCard.twitter}
                      onChange={(e) => setVCard({...vCard, twitter: e.target.value})}
                      placeholder="username"
                      className="input-premium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* MULTI-LINK PAGE */}
            {type === 'multilink' && (
              <div className="space-y-md">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider">Social Links List</label>
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="text-xs font-semibold text-brand-900 hover:underline"
                  >
                    + Add Link
                  </button>
                </div>

                <div className="space-y-sm">
                  {links.map((link, index) => (
                    <div key={index} className="flex gap-sm items-center">
                      <input
                        type="text"
                        required
                        value={link.title}
                        onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                        placeholder="Link Label (e.g. Portfolio)"
                        className="input-premium flex-1"
                      />
                      <input
                        type="url"
                        required
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                        placeholder="https://mywebsite.com"
                        className="input-premium flex-[2]"
                      />
                      {links.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(index)}
                          className="p-sm text-brand-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Customize Styles & Live Preview (col-span-1) */}
        <div className="space-y-lg">
          
          {/* Live Preview Card */}
          <div className="card-premium p-lg space-y-md sticky top-md">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-brand-900">QR Live Preview</h3>
              <p className="text-xs text-brand-400">Updates in real-time as you tweak styles.</p>
            </div>
            
            <div className="flex justify-center bg-brand-50 border border-brand-100 rounded-xl p-md">
              <canvas ref={canvasRef} className="max-w-full aspect-square bg-white rounded-lg shadow-premium border border-brand-100"></canvas>
            </div>

            {/* Customization Details */}
            <div className="space-y-md">
              <h4 className="text-xs font-semibold text-brand-700 uppercase tracking-wider border-b border-brand-100 pb-xs">
                Color & Logo Customize
              </h4>

              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-500 mb-xs">Foreground</label>
                  <div className="flex gap-xs items-center">
                    <input
                      type="color"
                      value={foregroundColor}
                      onChange={(e) => setForegroundColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-brand-200"
                    />
                    <span className="text-xs font-mono font-medium text-brand-700">{foregroundColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-500 mb-xs">Background</label>
                  <div className="flex gap-xs items-center">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-brand-200"
                    />
                    <span className="text-xs font-mono font-medium text-brand-700">{backgroundColor}</span>
                  </div>
                </div>
              </div>

              {/* Margin Selector */}
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-brand-500 mb-xs">
                  <span>Quiet Zone (Margin)</span>
                  <span>{margin}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full h-1 bg-brand-200 rounded-lg appearance-none cursor-pointer accent-brand-900"
                />
              </div>

              {/* Logo Overlay Uploader */}
              <div>
                <label className="block text-[10px] font-semibold text-brand-500 mb-xs">Center Logo Overlay</label>
                {logoPreviewUrl ? (
                  <div className="flex items-center justify-between p-xs border border-brand-200 rounded-lg bg-brand-50">
                    <div className="flex items-center gap-xs">
                      <img src={logoPreviewUrl} alt="Logo" className="w-8 h-8 object-cover rounded border border-brand-200" />
                      <span className="text-xs font-medium text-brand-700 truncate max-w-[100px]">{logoFile?.name}</span>
                    </div>
                    <button type="button" onClick={removeLogo} className="text-xs text-red-500 hover:text-red-700 font-semibold px-xs">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-brand-200 rounded-lg p-xs text-center relative bg-brand-50/20 hover:border-brand-900 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="text-[10px] font-semibold text-brand-600">Select Logo Image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Submit */}
            <div className="pt-sm">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-xs"
              >
                {loading ? 'Creating...' : 'Save QR Code'}
                {!loading && <Sparkles size={14} />}
              </button>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
};

export default QRCreate;
