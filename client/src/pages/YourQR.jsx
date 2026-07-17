import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getQRs, deleteQR } from '../services/qr.js';
import { renderQRCode } from '../utils/qrHelper.js';
import { 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Activity, 
  Edit3, 
  Trash2, 
  Eye, 
  QrCode 
} from 'lucide-react';

// Sub-component to render individual QR Code Canvas dynamically inside lists
const QRCardCanvas = ({ qr }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let payload = 'https://qube-qr.com';
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    if (qr.isDynamic) {
      payload = `${API_URL}/r/${qr.shortUrl}`;
    } else {
      switch (qr.type) {
        case 'website':
          payload = qr.data.url;
          break;
        case 'whatsapp':
          payload = `https://wa.me/${qr.data.phone}?text=${encodeURIComponent(qr.data.message || '')}`;
          break;
        case 'phone':
          payload = `tel:${qr.data.phone}`;
          break;
        case 'email':
          payload = `mailto:${qr.data.email}?subject=${encodeURIComponent(qr.data.subject || '')}&body=${encodeURIComponent(qr.data.body || '')}`;
          break;
        case 'sms':
          payload = `sms:${qr.data.phone}?body=${encodeURIComponent(qr.data.message || '')}`;
          break;
        case 'maps':
          if (qr.data.latitude && qr.data.longitude) {
            payload = `https://www.google.com/maps/search/?api=1&query=${qr.data.latitude},${qr.data.longitude}`;
          } else {
            payload = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(qr.data.address)}`;
          }
          break;
        case 'upi':
          payload = `upi://pay?pa=${qr.data.upiId}&pn=${encodeURIComponent(qr.data.upiName || 'Payee')}&tn=${encodeURIComponent(qr.data.upiNote || '')}&am=${qr.data.upiAmount || ''}&cu=INR`;
          break;
        default:
          payload = `https://qube-qr.com/public/${qr.type}`;
      }
    }

    renderQRCode(
      canvasRef.current,
      payload,
      { 
        foregroundColor: qr.config?.foregroundColor || '#0f172a', 
        backgroundColor: qr.config?.backgroundColor || '#ffffff', 
        margin: qr.config?.margin !== undefined ? qr.config.margin : 1, 
        width: 120 
      },
      qr.config?.logoUrl ? (qr.config.logoUrl.startsWith('/uploads') ? `${API_URL}${qr.config.logoUrl}` : qr.config.logoUrl) : null
    );
  }, [qr]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-20 h-20 bg-white rounded-lg shadow-premium border border-brand-100 flex-shrink-0"
    ></canvas>
  );
};

const YourQR = () => {
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'dynamic' | 'static'
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'website' | 'whatsapp' | ...
  const [error, setError] = useState('');

  const fetchQRsList = async () => {
    try {
      const data = await getQRs();
      setQrs(data.qrs);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your QR Codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRsList();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this QR code? All analytics data will be lost.')) return;
    try {
      await deleteQR(id);
      fetchQRsList();
    } catch (err) {
      alert('Failed to delete QR code.');
    }
  };

  const handleCopyLink = (shortUrl, qrId) => {
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const redirectUrl = `${serverUrl}/r/${shortUrl}`;
    navigator.clipboard.writeText(redirectUrl);
    setCopiedId(qrId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtering Logic
  const filteredQRs = qrs.filter((qr) => {
    const matchesSearch = qr.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = 
      filterType === 'all' || 
      (filterType === 'dynamic' && qr.isDynamic) || 
      (filterType === 'static' && !qr.isDynamic);
      
    const matchesCategory = 
      filterCategory === 'all' || 
      qr.type === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      
      {/* Header crumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900">Your QR Codes</h1>
          <p className="text-sm text-brand-500">Manage and filter your entire repository of static and dynamic codes.</p>
        </div>
        <Link to="/create" className="btn-primary flex items-center gap-xs w-max">
          <Plus size={16} />
          Create QR Code
        </Link>
      </div>

      {error && (
        <div className="p-sm bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Filter panel */}
      <div className="card-premium p-md flex flex-col md:flex-row gap-sm items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-sm text-brand-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search QR codes by name..."
            className="input-premium pl-xl py-2"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-sm w-full md:w-auto justify-end">
          
          {/* Dynamic/Static Filter */}
          <div className="flex items-center gap-xs">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider flex items-center gap-1">
              <Filter size={12} /> Type
            </span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-sm py-1.5 bg-white border border-brand-200 rounded-lg text-xs font-semibold text-brand-700 focus:outline-none focus:border-brand-900"
            >
              <option value="all">All Types</option>
              <option value="dynamic">Dynamic Only</option>
              <option value="static">Static Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-xs">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-sm py-1.5 bg-white border border-brand-200 rounded-lg text-xs font-semibold text-brand-700 focus:outline-none focus:border-brand-900"
            >
              <option value="all">All Categories</option>
              <option value="website">Website URLs</option>
              <option value="whatsapp">WhatsApp Chats</option>
              <option value="phone">Phone Dialer</option>
              <option value="email">Email Sender</option>
              <option value="sms">SMS text</option>
              <option value="maps">Google Maps</option>
              <option value="upi">UPI Payments</option>
              <option value="pdf">PDF Docs</option>
              <option value="image">Image Files</option>
              <option value="video">Video Streams</option>
              <option value="vcard">Digital Card</option>
              <option value="multilink">Multi-Link list</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main Grid display list */}
      {filteredQRs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {filteredQRs.map((qr) => (
            <div key={qr.id} className="card-premium card-premium-hover p-md flex gap-md items-center">
              
              {/* Dynamic canvas element rendering the QR */}
              <QRCardCanvas qr={qr} />

              {/* QR Details */}
              <div className="flex-1 min-w-0 space-y-sm">
                <div>
                  <div className="flex items-center gap-xs flex-wrap">
                    <h3 className="text-sm font-bold text-brand-900 truncate max-w-[150px]">{qr.name}</h3>
                    <span className="text-[8px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-mono font-semibold capitalize">
                      {qr.type}
                    </span>
                    {qr.isDynamic ? (
                      <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-semibold">
                        Dynamic
                      </span>
                    ) : (
                      <span className="text-[8px] bg-brand-100 text-brand-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                        Static
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-400 truncate max-w-[200px] mt-0.5">
                    {qr.type === 'website' && qr.data?.url}
                    {qr.type === 'whatsapp' && `WhatsApp: ${qr.data?.phone}`}
                    {qr.type === 'phone' && `Call: ${qr.data?.phone}`}
                    {qr.type === 'email' && `Mail: ${qr.data?.email}`}
                    {qr.type === 'sms' && `SMS: ${qr.data?.phone}`}
                    {qr.type === 'maps' && (qr.data?.address || `Coordinates: ${qr.data?.latitude}, ${qr.data?.longitude}`)}
                    {qr.type === 'upi' && `UPI: ${qr.data?.upiId}`}
                    {['pdf', 'image', 'video'].includes(qr.type) && (qr.data?.originalName || 'Uploaded File')}
                    {qr.type === 'vcard' && `VCard: ${qr.data?.firstName} ${qr.data?.lastName}`}
                    {qr.type === 'multilink' && `MultiLink (${qr.data?.links?.length || 0} links)`}
                  </p>
                </div>

                <div className="flex items-center gap-md">
                  <Link
                    to={`/qr/${qr.id}`}
                    className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-xs"
                  >
                    <Activity size={12} />
                    Analytics
                  </Link>
                  {qr.isDynamic && (
                    <button
                      onClick={() => handleCopyLink(qr.shortUrl, qr.id)}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-xs"
                    >
                      {copiedId === qr.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedId === qr.id ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>

              {/* Actions Right Buttons */}
              <div className="flex flex-col gap-sm justify-between items-end h-full self-stretch flex-shrink-0">
                <div className="flex gap-xs">
                  <Link
                    to={`/qr/${qr.id}`}
                    className="p-sm text-brand-400 hover:text-brand-900 border border-brand-100 bg-white rounded-lg hover:shadow-premium transition-all duration-150"
                    title="View Details"
                  >
                    <Eye size={13} />
                  </Link>
                  <Link
                    to={`/qr/${qr.id}/edit`}
                    className="p-sm text-brand-400 hover:text-brand-900 border border-brand-100 bg-white rounded-lg hover:shadow-premium transition-all duration-150"
                    title="Edit Config"
                  >
                    <Edit3 size={13} />
                  </Link>
                  <button
                    onClick={() => handleDelete(qr.id)}
                    className="p-sm text-brand-400 hover:text-red-600 border border-brand-100 bg-white rounded-lg hover:shadow-premium hover:border-red-100 transition-all duration-150"
                    title="Delete QR"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <span className="text-[10px] text-brand-400 font-medium">
                  {qr.scanCount || 0} scans
                </span>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="card-premium p-xl flex flex-col items-center justify-center text-center py-xl">
          <div className="p-md bg-brand-50 text-brand-500 rounded-full border border-brand-100">
            <QrCode size={32} />
          </div>
          <div>
            <h5 className="font-semibold text-brand-900 mt-sm">No QR codes found</h5>
            <p className="text-xs text-brand-500 max-w-[280px] mt-xs">Try adjusting your search criteria or create a new QR code.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default YourQR;
