import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Globe, 
  MessageSquare, 
  Mail, 
  ExternalLink 
} from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const PublicMultiLink = () => {
  const { id } = useParams();
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${API_URL}/r/public/${id}`);
        setQr(response.data.qr);
      } catch (err) {
        console.error(err);
        setError('Link Page not found or has been deactivated.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !qr) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center p-md">
        <div className="max-w-md w-full text-center space-y-sm bg-white p-lg border border-brand-200 rounded-xl shadow-premium">
          <h2 className="text-lg font-bold text-brand-900">Link Page Offline</h2>
          <p className="text-xs text-brand-500">{error || 'The page you requested does not exist.'}</p>
        </div>
      </div>
    );
  }

  const { name, config, data } = qr;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const logoUrl = config?.logoUrl 
    ? (config.logoUrl.startsWith('/uploads') ? `${API_URL}${config.logoUrl}` : config.logoUrl)
    : null;

  // Function to return standard icons based on URLs or titles
  const getLinkIcon = (title, url) => {
    const text = (title + ' ' + url).toLowerCase();
    if (text.includes('instagram')) return InstagramIcon;
    if (text.includes('linkedin')) return LinkedinIcon;
    if (text.includes('github')) return GithubIcon;
    if (text.includes('whatsapp') || text.includes('wa.me')) return MessageSquare;
    if (text.includes('email') || text.includes('mailto')) return Mail;
    return Globe;
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-md transition-all duration-300"
      style={{ backgroundColor: config?.backgroundColor || '#f8fafc' }}
    >
      <div className="max-w-md w-full space-y-lg text-center animate-fade-in">
        
        {/* Profile Card Header */}
        <div className="space-y-sm">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Profile Logo" 
              className="w-20 h-20 mx-auto rounded-full object-cover border-2 shadow-premium"
              style={{ borderColor: config?.foregroundColor || '#0f172a' }}
            />
          ) : (
            <div 
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xl shadow-premium"
              style={{ backgroundColor: config?.foregroundColor || '#0f172a' }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <h2 className="text-xl font-bold tracking-tight" style={{ color: config?.foregroundColor || '#0f172a' }}>
            {name}
          </h2>
          <p className="text-xs text-brand-500">Links shared via Qube QR Platform</p>
        </div>

        {/* Buttons List */}
        <div className="space-y-sm">
          {data?.links && data.links.length > 0 ? (
            data.links.map((link, index) => {
              const Icon = getLinkIcon(link.title, link.url);
              // Ensure URL has a protocol
              const formattedUrl = /^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`;
              
              return (
                <a
                  key={index}
                  href={formattedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-md border rounded-xl font-medium text-sm transition-all duration-200 shadow-premium hover:shadow-premium-hover hover:scale-[1.01]"
                  style={{ 
                    borderColor: config?.foregroundColor ? `${config.foregroundColor}20` : '#cbd5e1',
                    color: config?.foregroundColor || '#0f172a',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div className="flex items-center gap-md">
                    <Icon size={18} style={{ color: config?.foregroundColor || '#0f172a' }} />
                    <span>{link.title}</span>
                  </div>
                  <ExternalLink size={14} className="opacity-40" />
                </a>
              );
            })
          ) : (
            <p className="text-xs text-brand-400">No links added to this page yet.</p>
          )}
        </div>

        {/* Footer credit */}
        <div className="pt-lg">
          <p className="text-[9px] text-brand-400 tracking-wider uppercase font-mono">
            Powered by Qube Platform
          </p>
        </div>

      </div>
    </div>
  );
};

export default PublicMultiLink;
