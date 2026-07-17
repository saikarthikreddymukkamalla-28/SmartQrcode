import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQRs, updateQR } from '../services/qr.js';
import { renderQRCode } from '../utils/qrHelper.js';
import { 
  ArrowLeft,
  Sparkles,
  Upload,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const QREdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [type, setType] = useState('website');
  const [isDynamic, setIsDynamic] = useState(true);
  const [shortUrl, setShortUrl] = useState('');

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
  
  // File details
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState('');
  
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

  // Load existing QR details
  useEffect(() => {
    const fetchQRDetails = async () => {
      try {
        const qrList = await getQRs();
        const currentQr = qrList.qrs.find(q => q.id === id);
        
        if (!currentQr) {
          setError('QR Code not found.');
          setLoading(false);
          return;
        }

        setName(currentQr.name);
        setType(currentQr.type);
        setIsDynamic(currentQr.isDynamic);
        setShortUrl(currentQr.shortUrl);

        // Prepopulate type specific content
        const data = currentQr.data;
        switch (currentQr.type) {
          case 'website':
            setUrl(data.url || '');
            break;
          case 'whatsapp':
            setPhone(data.phone || '');
            setMessage(data.message || '');
            break;
          case 'phone':
            setPhone(data.phone || '');
            break;
          case 'email':
            setEmail(data.email || '');
            setSubject(data.subject || '');
            setBody(data.body || '');
            break;
          case 'sms':
            setPhone(data.phone || '');
            setMessage(data.message || '');
            break;
          case 'maps':
            setLatitude(data.latitude || '');
            setLongitude(data.longitude || '');
            setAddress(data.address || '');
            break;
          case 'upi':
            setUpiId(data.upiId || '');
            setUpiName(data.name || '');
            setUpiAmount(data.amount || '');
            setUpiNote(data.note || '');
            break;
          case 'vcard':
            setVCard({ ...vCard, ...data });
            break;
          case 'multilink':
            setLinks(data.links || [{ title: 'Website', url: '' }]);
            break;
          case 'pdf':
          case 'image':
          case 'video':
            setExistingFileUrl(data.fileUrl || '');
            break;
          default:
            break;
        }

        // Prepopulate styles
        const config = currentQr.config;
        if (config) {
          setForegroundColor(config.foregroundColor || '#0f172a');
          setBackgroundColor(config.backgroundColor || '#ffffff');
          setMargin(config.margin !== undefined ? config.margin : 2);
          if (config.logoUrl) {
            setLogoPreviewUrl(config.logoUrl);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch QR details.');
      } finally {
        setLoading(false);
      }
    };

    fetchQRDetails();
  }, [id]);

  // Update QR preview
  useEffect(() => {
    if (loading) return;

    let payload = 'https://qube-qr.com';
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    if (isDynamic) {
      payload = `${API_URL}/r/${shortUrl}`;
    } else {
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
      logoFile || logoPreviewUrl
    );
  }, [
    loading, type, isDynamic, shortUrl, url, phone, message, email, subject, body, 
    latitude, longitude, address, upiId, upiName, upiAmount, upiNote,
    foregroundColor, backgroundColor, margin, logoFile, logoPreviewUrl
  ]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
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
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name);

      // Serialize config
      const config = {
        foregroundColor,
        backgroundColor,
        margin,
        // Keep existing logoUrl if no new logo is selected
        logoUrl: logoFile ? undefined : logoPreviewUrl 
      };
      formData.append('config', JSON.stringify(config));

      // Formulate type data
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
        case 'pdf':
        case 'image':
        case 'video':
          data = { fileUrl: existingFileUrl };
          break;
        default:
          break;
      }
      formData.append('data', JSON.stringify(data));

      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await updateQR(id, formData);

      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 }
      });

      navigate(`/qr/${id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update QR Code.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-xs">
        <button onClick={() => navigate(`/qr/${id}`)} className="p-sm text-brand-500 hover:text-brand-900 rounded-lg hover:bg-brand-100 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-xs text-brand-400">QR Manager / Details /</span>
          <h1 className="text-xl font-bold text-brand-900 leading-none mt-1">Edit QR Code Details</h1>
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
            <h3 className="text-sm font-semibold text-brand-900 border-b border-brand-100 pb-sm">1. Name & Dynamic Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">
                  QR Code Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium"
                />
              </div>

              <div className="flex items-center gap-xs p-sm border border-brand-100 rounded-lg bg-brand-50/50">
                <AlertTriangle className="text-amber-500 flex-shrink-0" size={16} />
                <span className="text-[10px] text-brand-600">
                  {isDynamic 
                    ? 'This QR code is Dynamic. You can update its destination details below without modifying the printed image.' 
                    : 'This QR code is Static. Its destination is hardcoded inside the image and cannot be modified.'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Config data */}
          <div className="card-premium p-lg space-y-md">
            <h3 className="text-sm font-semibold text-brand-900 border-b border-brand-100 pb-sm">2. Destination Configuration</h3>
            
            {/* If static, disable inputs */}
            <fieldset disabled={!isDynamic} className={!isDynamic ? 'opacity-60 pointer-events-none' : ''}>
              
              {/* WEBSITE INPUTS */}
              {type === 'website' && (
                <div>
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Website URL</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input-premium"
                  />
                </div>
              )}

              {/* WHATSAPP INPUTS */}
              {type === 'whatsapp' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">WhatsApp Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Message</label>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
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
                        className="input-premium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Body</label>
                      <input
                        type="text"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
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
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Message</label>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
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
                      <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Latitude</label>
                      <input
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="input-premium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Longitude</label>
                      <input
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="input-premium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
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
                      className="input-premium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Amount (INR)</label>
                    <input
                      type="number"
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Note</label>
                    <input
                      type="text"
                      value={upiNote}
                      onChange={(e) => setUpiNote(e.target.value)}
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
                  Replace {type.toUpperCase()} File (Optional)
                </label>
                <div className="border border-dashed border-brand-200 hover:border-brand-900 rounded-xl p-md transition-colors text-center relative bg-brand-50/20">
                  <input
                    type="file"
                    accept={type === 'pdf' ? '.pdf' : type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-xs">
                    <Upload className="text-brand-400" size={20} />
                    <span className="text-xs font-medium text-brand-700">
                      {selectedFile ? selectedFile.name : `Select a new ${type.toUpperCase()} file to overwrite the current one`}
                    </span>
                  </div>
                </div>

                {existingFileUrl && !selectedFile && (
                  <div className="text-[10px] text-brand-400 bg-white border border-brand-100 p-sm rounded-lg flex items-center justify-between">
                    <span className="truncate max-w-[200px]">Current Asset URL: {existingFileUrl}</span>
                    <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${existingFileUrl}`} target="_blank" rel="noreferrer" className="text-brand-900 font-semibold hover:underline">
                      View file
                    </a>
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
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Job Title</label>
                    <input
                      type="text"
                      value={vCard.title}
                      onChange={(e) => setVCard({...vCard, title: e.target.value})}
                      className="input-premium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Phone</label>
                    <input
                      type="tel"
                      value={vCard.phone}
                      onChange={(e) => setVCard({...vCard, phone: e.target.value})}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Email</label>
                    <input
                      type="email"
                      value={vCard.email}
                      onChange={(e) => setVCard({...vCard, email: e.target.value})}
                      className="input-premium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Address</label>
                  <input
                    type="text"
                    value={vCard.address}
                    onChange={(e) => setVCard({...vCard, address: e.target.value})}
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
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">GitHub</label>
                    <input
                      type="text"
                      value={vCard.github}
                      onChange={(e) => setVCard({...vCard, github: e.target.value})}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider mb-xs">Twitter</label>
                    <input
                      type="text"
                      value={vCard.twitter}
                      onChange={(e) => setVCard({...vCard, twitter: e.target.value})}
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
                  <label className="block text-xs font-semibold text-brand-500 uppercase tracking-wider">Social Links</label>
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
                        className="input-premium flex-1"
                      />
                      <input
                        type="url"
                        required
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
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
            
            </fieldset>
          </div>
        </div>

        {/* Right Side: Customize Styles & Live Preview */}
        <div className="space-y-lg">
          
          <div className="card-premium p-lg space-y-md sticky top-md">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-brand-900">QR Live Preview</h3>
              <p className="text-xs text-brand-400">Previews the output code image.</p>
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
                      <img src={logoPreviewUrl.startsWith('http') || logoPreviewUrl.startsWith('/uploads') ? (logoPreviewUrl.startsWith('/uploads') ? `${API_URL}${logoPreviewUrl}` : logoPreviewUrl) : logoPreviewUrl} alt="Logo" className="w-8 h-8 object-cover rounded border border-brand-200" />
                      <span className="text-xs font-medium text-brand-700 truncate max-w-[100px]">
                        {logoFile ? logoFile.name : 'Current Logo'}
                      </span>
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
                disabled={saving}
                className="w-full btn-primary flex items-center justify-center gap-xs"
              >
                {saving ? 'Updating...' : 'Update QR Code'}
                {!saving && <Sparkles size={14} />}
              </button>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
};

export default QREdit;
