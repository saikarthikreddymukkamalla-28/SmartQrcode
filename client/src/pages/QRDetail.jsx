import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getQRs, getQRAnalytics, deleteQR } from '../services/qr.js';
import { renderQRCode, downloadQRCode } from '../utils/qrHelper.js';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Download,
  Calendar,
  Eye,
  Activity,
  Laptop,
  Smartphone,
  Tablet,
  Globe
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const COLORS = ['#0f172a', '#475569', '#94a3b8', '#cbd5e1', '#e2e8f0'];

const QRDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // States
  const [qr, setQr] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    try {
      const qrList = await getQRs();
      const currentQr = qrList.qrs.find(q => q.id === id);
      
      if (!currentQr) {
        setError('QR Code not found.');
        setLoading(false);
        return;
      }
      setQr(currentQr);

      // Fetch specific analytics
      const analyticsData = await getQRAnalytics(id);
      setAnalytics(analyticsData.analytics);
    } catch (err) {
      console.error(err);
      setError('Failed to load QR details and analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Update canvas preview
  useEffect(() => {
    if (!qr || loading) return;

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
        margin: qr.config?.margin !== undefined ? qr.config.margin : 2, 
        width: 300 
      },
      qr.config?.logoUrl ? (qr.config.logoUrl.startsWith('/uploads') ? `${API_URL}${qr.config.logoUrl}` : qr.config.logoUrl) : null
    );
  }, [qr, loading]);

  const handleCopyLink = () => {
    if (!qr) return;
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const redirectUrl = `${serverUrl}/r/${qr.shortUrl}`;
    navigator.clipboard.writeText(redirectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format) => {
    if (!qr || !canvasRef.current) return;
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const payload = qr.isDynamic 
      ? `${serverUrl}/r/${qr.shortUrl}` 
      : qr.data.url || `https://qube-qr.com/static/${qr.id}`;

    downloadQRCode(
      canvasRef.current,
      qr.name.toLowerCase().replace(/\s+/g, '-'),
      format,
      payload,
      qr.config
    );
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this QR code permanently? This operation is irreversible.')) {
      return;
    }
    try {
      await deleteQR(id);
      navigate('/');
    } catch (err) {
      alert('Failed to delete QR code.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-md">
        <Link to="/" className="text-xs text-brand-600 hover:text-brand-900 flex items-center gap-xs">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="p-md bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      </div>
    );
  }

  const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const redirectUrl = `${serverUrl}/r/${qr.shortUrl}`;

  return (
    <div className="space-y-lg animate-fade-in">
      
      {/* Header crumb and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div className="flex items-center gap-xs">
          <button onClick={() => navigate('/')} className="p-sm text-brand-500 hover:text-brand-900 rounded-lg hover:bg-brand-100 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-xs text-brand-400">QR Manager /</span>
            <h1 className="text-xl font-bold text-brand-900 leading-none mt-1">{qr.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-sm">
          <Link to={`/qr/${qr.id}/edit`} className="btn-secondary flex items-center gap-xs text-xs font-semibold py-2">
            <Edit3 size={14} />
            Edit QR Code
          </Link>
          <button onClick={handleDelete} className="btn-danger flex items-center gap-xs text-xs font-semibold py-2">
            <Trash2 size={14} />
            Delete QR
          </button>
        </div>
      </div>

      {/* Main detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Left column: QR Card, Link Copy, details (col-span-1) */}
        <div className="space-y-lg">
          <div className="card-premium p-lg flex flex-col items-center text-center space-y-md">
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-md">
              <canvas ref={canvasRef} className="max-w-full aspect-square bg-white rounded-lg shadow-premium border border-brand-100"></canvas>
            </div>

            <div className="w-full text-left space-y-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-brand-400">Type</span>
                <span className="text-xs font-semibold text-brand-800 capitalize">{qr.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-brand-400">Routing</span>
                <span className="text-xs font-semibold text-brand-800">{qr.isDynamic ? 'Dynamic (Redirect)' : 'Static'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-brand-400">Created</span>
                <span className="text-xs font-semibold text-brand-800">{new Date(qr.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Quick Redirect Link (Dynamic only) */}
            {qr.isDynamic && (
              <div className="w-full p-sm border border-brand-200 rounded-lg bg-brand-50/50 flex items-center justify-between gap-sm">
                <span className="text-xs text-brand-600 truncate font-mono select-all">{redirectUrl}</span>
                <button onClick={handleCopyLink} className="p-xs hover:bg-brand-200 rounded text-brand-600 hover:text-brand-900 transition-colors">
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            )}

            {/* Downloads buttons */}
            <div className="w-full space-y-sm">
              <div className="grid grid-cols-2 gap-sm">
                <button onClick={() => handleDownload('png')} className="btn-secondary py-2 flex items-center justify-center gap-xs text-xs">
                  <Download size={12} /> PNG Image
                </button>
                <button onClick={() => handleDownload('svg')} className="btn-secondary py-2 flex items-center justify-center gap-xs text-xs">
                  <Download size={12} /> SVG Vector
                </button>
              </div>
              <button onClick={() => handleDownload('pdf')} className="btn-secondary w-full py-2 flex items-center justify-center gap-xs text-xs">
                <Download size={12} /> PDF Document
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Analytics Summary (col-span-2) */}
        <div className="lg:col-span-2 space-y-lg">
          
          {/* KPI Analytics */}
          <div className="grid grid-cols-3 gap-md">
            <div className="card-premium p-md">
              <span className="text-[10px] uppercase font-semibold text-brand-400">Total Scans</span>
              <h3 className="text-2xl font-bold text-brand-900 mt-xs">{analytics?.totalScans || 0}</h3>
            </div>
            <div className="card-premium p-md">
              <span className="text-[10px] uppercase font-semibold text-brand-400">Scan Activity</span>
              <h3 className="text-2xl font-bold text-brand-900 mt-xs">
                {analytics?.totalScans > 0 ? 'Active' : 'Idle'}
              </h3>
            </div>
            <div className="card-premium p-md">
              <span className="text-[10px] uppercase font-semibold text-brand-400">Unique Devices</span>
              <h3 className="text-2xl font-bold text-brand-900 mt-xs">
                {analytics?.devices?.length || 0}
              </h3>
            </div>
          </div>

          {/* Area Chart: Scans over time */}
          <div className="card-premium p-lg space-y-md">
            <div>
              <h4 className="text-sm font-semibold text-brand-900 flex items-center gap-xs">
                <Calendar size={14} />
                Scan History (Last 30 Days)
              </h4>
              <p className="text-xs text-brand-500">Hits aggregated daily.</p>
            </div>

            <div className="h-56 w-full">
              {analytics?.history && analytics.history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScansDetailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.08}/>
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0.00}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px' }} 
                    />
                    <Area type="monotone" dataKey="count" stroke="#0f172a" strokeWidth={1.5} fillOpacity={1} fill="url(#colorScansDetailed)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Activity size={24} className="text-brand-300 mb-xs" />
                  <p className="text-xs text-brand-400">Waiting for scans to plot distribution.</p>
                </div>
              )}
            </div>
          </div>

          {/* Device and OS breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            
            {/* Device breakdown */}
            <div className="card-premium p-lg space-y-md">
              <h4 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Device Distribution</h4>
              <div className="h-44 flex items-center justify-center">
                {analytics?.devices && analytics.devices.length > 0 ? (
                  <div className="w-full h-full flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.devices}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics.devices.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-xs">
                      {analytics.devices.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-xs text-xs text-brand-600">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="capitalize">{entry.name}: {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-brand-400">No device data logged yet.</p>
                )}
              </div>
            </div>

            {/* OS Breakdown */}
            <div className="card-premium p-lg space-y-md">
              <h4 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">OS Distribution</h4>
              <div className="h-44 flex items-center justify-center">
                {analytics?.os && analytics.os.length > 0 ? (
                  <div className="w-full h-full flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.os}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics.os.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-xs">
                      {analytics.os.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-xs text-xs text-brand-600">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span>{entry.name}: {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-brand-400">No OS data logged yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Scans list logs (last 10) */}
          <div className="card-premium p-lg space-y-md">
            <div>
              <h4 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Recent Scan Events</h4>
              <p className="text-xs text-brand-500">History of the latest 10 scan logs.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-600">
                <thead>
                  <tr className="border-b border-brand-100 text-brand-400 font-semibold uppercase tracking-wider">
                    <th className="py-sm px-xs">Time</th>
                    <th className="py-sm px-xs">IP Address</th>
                    <th className="py-sm px-xs">Device</th>
                    <th className="py-sm px-xs">Browser / OS</th>
                    <th className="py-sm px-xs">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.recentScans && analytics.recentScans.length > 0 ? (
                    analytics.recentScans.map((scan) => (
                      <tr key={scan.id} className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors">
                        <td className="py-sm px-xs font-medium text-brand-800">
                          {new Date(scan.scannedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-sm px-xs font-mono">{scan.ip}</td>
                        <td className="py-sm px-xs capitalize">{scan.device}</td>
                        <td className="py-sm px-xs">
                          {scan.browser} / {scan.os}
                        </td>
                        <td className="py-sm px-xs">{scan.country}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-lg text-center text-brand-400">
                        No scan events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default QRDetail;
