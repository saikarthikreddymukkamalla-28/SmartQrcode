import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary, getQRs, deleteQR } from '../services/qr.js';
import { 
  QrCode, 
  Eye, 
  Trash2, 
  Plus, 
  ArrowUpRight, 
  Activity, 
  Copy, 
  Check, 
  Link as LinkIcon 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const summaryData = await getDashboardSummary();
      const qrList = await getQRs();
      setSummary(summaryData.summary);
      setQrs(qrList.qrs);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err.message);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this QR Code? All scan data will be permanently lost.')) {
      return;
    }
    try {
      await deleteQR(id);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to delete QR code: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCopyLink = (shortUrl, qrId) => {
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const redirectUrl = `${serverUrl}/r/${shortUrl}`;
    navigator.clipboard.writeText(redirectUrl);
    setCopiedId(qrId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Aggregate scans history for a general trend (mocking or summing)
  // Let's create dummy week history for the general area chart
  const weekData = [
    { name: 'Mon', scans: 0 },
    { name: 'Tue', scans: 0 },
    { name: 'Wed', scans: 0 },
    { name: 'Thu', scans: 0 },
    { name: 'Fri', scans: 0 },
    { name: 'Sat', scans: 0 },
    { name: 'Sun', scans: 0 },
  ];

  // Feed recent scans dates into general chart if available
  if (summary && summary.recentScans) {
    summary.recentScans.forEach(scan => {
      const day = new Date(scan.scannedAt).toLocaleDateString('en-US', { weekday: 'short' });
      const found = weekData.find(w => w.name === day);
      if (found) found.scans++;
    });
  }

  return (
    <div className="space-y-lg">
      {/* Upper header action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900">Workspace Dashboard</h1>
          <p className="text-sm text-brand-500">Monitor QR distributions, redirection hits, and scanner metrics.</p>
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="card-premium p-md flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Total QRs</p>
            <h3 className="text-2xl font-bold text-brand-900 mt-xs">{summary?.totalQRs || 0}</h3>
          </div>
          <p className="text-[10px] text-brand-400 mt-sm">Created codes</p>
        </div>

        <div className="card-premium p-md flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Dynamic QRs</p>
            <h3 className="text-2xl font-bold text-brand-900 mt-xs">{summary?.dynamicQRs || 0}</h3>
          </div>
          <p className="text-[10px] text-emerald-600 mt-sm font-medium">Editable destination</p>
        </div>

        <div className="card-premium p-md flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Static QRs</p>
            <h3 className="text-2xl font-bold text-brand-900 mt-xs">{summary?.staticQRs || 0}</h3>
          </div>
          <p className="text-[10px] text-brand-400 mt-sm">Fixed destination</p>
        </div>

        <div className="card-premium p-md flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Total Scans</p>
            <h3 className="text-2xl font-bold text-brand-900 mt-xs">{summary?.totalScans || 0}</h3>
          </div>
          <p className="text-[10px] text-brand-400 mt-sm">Hits logged</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Scans Trend Chart */}
        <div className="card-premium p-lg lg:col-span-2 space-y-md">
          <div>
            <h4 className="text-sm font-semibold text-brand-900">Activity Overview</h4>
            <p className="text-xs text-brand-500">Scan distributions across active codes this week.</p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0.00}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px' }} 
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="scans" stroke="#0f172a" strokeWidth={1.5} fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Scan hits */}
        <div className="card-premium p-lg space-y-md flex flex-col">
          <div>
            <h4 className="text-sm font-semibold text-brand-900">Recent Scans</h4>
            <p className="text-xs text-brand-500">Latest hits recorded globally.</p>
          </div>
          <div className="flex-1 space-y-sm overflow-y-auto max-h-[190px] pr-xs">
            {summary?.recentScans && summary.recentScans.length > 0 ? (
              summary.recentScans.map((scan) => (
                <div key={scan.id} className="flex justify-between items-center p-sm border border-brand-100 rounded-lg bg-brand-50/50 hover:bg-brand-50 transition-colors duration-150">
                  <div>
                    <h5 className="text-xs font-semibold text-brand-800 truncate max-w-[130px]">{scan.qrName}</h5>
                    <p className="text-[10px] text-brand-400 capitalize">{scan.qrType} • {scan.device}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-brand-700">{scan.country}</p>
                    <p className="text-[9px] text-brand-400">{new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-lg">
                <Activity className="text-brand-300 mb-xs" size={24} />
                <p className="text-xs text-brand-400">No scans logged yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Codes List Grid */}
      <div className="space-y-md">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-brand-900">Recent QR Codes</h4>
          <span className="text-xs text-brand-400">{qrs.length} Codes created</span>
        </div>

        {qrs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {qrs.map((qr) => (
              <div key={qr.id} className="card-premium card-premium-hover p-md flex gap-md justify-between items-start">
                <div className="space-y-sm flex-1 min-w-0">
                  <div className="flex items-center gap-xs flex-wrap">
                    <span className="text-xs font-semibold text-brand-900 truncate max-w-[150px]">{qr.name}</span>
                    <span className="text-[9px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-mono font-medium capitalize">
                      {qr.type}
                    </span>
                    {qr.isDynamic ? (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-medium">
                        Dynamic
                      </span>
                    ) : (
                      <span className="text-[9px] bg-brand-100 text-brand-500 px-1.5 py-0.5 rounded font-mono font-medium">
                        Static
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-brand-400 truncate max-w-[280px]">
                    {qr.type === 'website' && qr.data?.url}
                    {qr.type === 'whatsapp' && `WhatsApp: ${qr.data?.phone}`}
                    {qr.type === 'phone' && `Call: ${qr.data?.phone}`}
                    {qr.type === 'email' && `Email: ${qr.data?.email}`}
                    {qr.type === 'sms' && `SMS to ${qr.data?.phone}`}
                    {qr.type === 'maps' && (qr.data?.address || `Coordinates: ${qr.data?.latitude}, ${qr.data?.longitude}`)}
                    {qr.type === 'upi' && `UPI ID: ${qr.data?.upiId}`}
                    {['pdf', 'image', 'video'].includes(qr.type) && (qr.data?.originalName || 'Uploaded Asset')}
                    {qr.type === 'vcard' && `Digital Card: ${qr.data?.firstName} ${qr.data?.lastName}`}
                    {qr.type === 'multilink' && `Multi-link Card (${qr.data?.links?.length || 0} links)`}
                  </p>

                  <div className="flex items-center gap-md pt-xs">
                    <Link
                      to={`/qr/${qr.id}`}
                      className="text-xs font-medium text-brand-700 hover:text-brand-900 flex items-center gap-xs"
                    >
                      <Activity size={12} />
                      Analytics
                    </Link>
                    {qr.isDynamic && (
                      <button
                        onClick={() => handleCopyLink(qr.shortUrl, qr.id)}
                        className="text-xs font-medium text-brand-700 hover:text-brand-900 flex items-center gap-xs"
                      >
                        {copiedId === qr.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {copiedId === qr.id ? 'Copied' : 'Copy link'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-sm items-end">
                  <div className="flex items-center gap-xs">
                    <Link
                      to={`/qr/${qr.id}`}
                      className="p-sm text-brand-400 hover:text-brand-900 border border-brand-100 bg-white rounded-lg hover:shadow-premium transition-all duration-150"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(qr.id)}
                      className="p-sm text-brand-400 hover:text-red-600 border border-brand-100 bg-white rounded-lg hover:shadow-premium hover:border-red-100 transition-all duration-150"
                      title="Delete QR"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <span className="text-[10px] text-brand-400">
                    {qr.scanCount || 0} scans
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-premium p-xl flex flex-col items-center justify-center text-center space-y-sm py-xl">
            <div className="p-md bg-brand-50 text-brand-500 rounded-full border border-brand-100">
              <QrCode size={32} />
            </div>
            <div>
              <h5 className="font-semibold text-brand-900">No QR codes created yet</h5>
              <p className="text-xs text-brand-500 max-w-[280px] mt-xs">Generate your first static or dynamic QR code and customize its style instantly.</p>
            </div>
            <Link to="/create" className="btn-primary">
              Create QR Code
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
