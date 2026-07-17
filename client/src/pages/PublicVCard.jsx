import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  UserPlus, 
  Building
} from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width={props.size || 18} height={props.size || 18} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" width={props.size || 18} height={props.size || 18} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" width={props.size || 18} height={props.size || 18} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const PublicVCard = () => {
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
        setError('Business Card not found or has been deactivated.');
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
          <h2 className="text-lg font-bold text-brand-900">Card Offline</h2>
          <p className="text-xs text-brand-500">{error || 'The digital card does not exist.'}</p>
        </div>
      </div>
    );
  }

  const { config, data } = qr;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const logoUrl = config?.logoUrl 
    ? (config.logoUrl.startsWith('/uploads') ? `${API_URL}${config.logoUrl}` : config.logoUrl)
    : null;

  // Generate and download standard .vcf file
  const handleSaveContact = () => {
    if (!data) return;

    const vcardContent = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${data.lastName || ''};${data.firstName || ''};;;`,
      `FN:${data.firstName || ''} ${data.lastName || ''}`,
      data.organization ? `ORG:${data.organization}` : '',
      data.title ? `TITLE:${data.title}` : '',
      data.phone ? `TEL;TYPE=CELL:${data.phone}` : '',
      data.email ? `EMAIL;TYPE=PREF,INTERNET:${data.email}` : '',
      data.address ? `ADR;TYPE=WORK:;;${data.address};;;;` : '',
      data.website ? `URL:${data.website}` : '',
      `REV:${new Date().toISOString()}`,
      'END:VCARD'
    ].filter(line => line !== '').join('\r\n');

    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${data.firstName || 'contact'}_${data.lastName || 'card'}.vcf`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasSocials = data?.linkedin || data?.github || data?.twitter;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-md"
      style={{ backgroundColor: config?.backgroundColor || '#f8fafc' }}
    >
      <div className="max-w-md w-full space-y-md animate-fade-in">
        
        {/* Card Body Container */}
        <div className="bg-white border border-brand-200 rounded-2xl shadow-premium p-xl space-y-lg relative overflow-hidden">
          
          {/* Top Decorative accent */}
          <div 
            className="absolute top-0 left-0 w-full h-2"
            style={{ backgroundColor: config?.foregroundColor || '#0f172a' }}
          ></div>

          {/* Profile Header */}
          <div className="flex gap-md items-center">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Profile Avatar" 
                className="w-16 h-16 rounded-full object-cover border border-brand-200 shadow-premium"
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-premium"
                style={{ backgroundColor: config?.foregroundColor || '#0f172a' }}
              >
                {(data?.firstName?.charAt(0) || '') + (data?.lastName?.charAt(0) || '')}
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-brand-900">
                {data?.firstName} {data?.lastName}
              </h2>
              {data?.title && (
                <p className="text-xs font-medium text-brand-600">{data.title}</p>
              )}
              {data?.organization && (
                <p className="text-[10px] text-brand-400 flex items-center gap-xs mt-0.5">
                  <Building size={10} />
                  {data.organization}
                </p>
              )}
            </div>
          </div>

          {/* Action Save Button */}
          <button
            onClick={handleSaveContact}
            className="w-full btn-primary flex items-center justify-center gap-xs py-2.5 hover:scale-[1.01]"
            style={{ 
              backgroundColor: config?.foregroundColor || '#0f172a',
            }}
          >
            <UserPlus size={16} />
            Save Contact Card
          </button>

          {/* Communication list */}
          <div className="space-y-sm pt-sm border-t border-brand-100">
            {data?.phone && (
              <a href={`tel:${data.phone}`} className="flex items-center gap-md p-sm rounded-lg hover:bg-brand-50 transition-colors group">
                <div className="p-xs bg-brand-50 rounded-lg group-hover:bg-white border border-brand-100">
                  <Phone size={14} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-400">Mobile Phone</p>
                  <p className="text-xs font-semibold text-brand-800">{data.phone}</p>
                </div>
              </a>
            )}

            {data?.email && (
              <a href={`mailto:${data.email}`} className="flex items-center gap-md p-sm rounded-lg hover:bg-brand-50 transition-colors group">
                <div className="p-xs bg-brand-50 rounded-lg group-hover:bg-white border border-brand-100">
                  <Mail size={14} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-400">Work Email</p>
                  <p className="text-xs font-semibold text-brand-800">{data.email}</p>
                </div>
              </a>
            )}

            {data?.address && (
              <div className="flex items-center gap-md p-sm rounded-lg">
                <div className="p-xs bg-brand-50 rounded-lg border border-brand-100">
                  <MapPin size={14} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-400">Location Address</p>
                  <p className="text-xs font-semibold text-brand-800">{data.address}</p>
                </div>
              </div>
            )}

            {data?.website && (
              <a href={/^https?:\/\//i.test(data.website) ? data.website : `https://${data.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-md p-sm rounded-lg hover:bg-brand-50 transition-colors group">
                <div className="p-xs bg-brand-50 rounded-lg group-hover:bg-white border border-brand-100">
                  <Globe size={14} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-400">Website</p>
                  <p className="text-xs font-semibold text-brand-800 truncate max-w-[200px]">{data.website}</p>
                </div>
              </a>
            )}
          </div>

          {/* Social Links Row */}
          {hasSocials && (
            <div className="flex items-center justify-center gap-md pt-md border-t border-brand-100">
              {data.linkedin && (
                <a 
                  href={`https://linkedin.com/in/${data.linkedin}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-sm bg-brand-50 rounded-full border border-brand-100 text-brand-500 hover:text-brand-900 transition-colors"
                >
                  <LinkedinIcon size={16} />
                </a>
              )}
              {data.github && (
                <a 
                  href={`https://github.com/${data.github}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-sm bg-brand-50 rounded-full border border-brand-100 text-brand-500 hover:text-brand-900 transition-colors"
                >
                  <GithubIcon size={16} />
                </a>
              )}
              {data.twitter && (
                <a 
                  href={`https://twitter.com/${data.twitter}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-sm bg-brand-50 rounded-full border border-brand-100 text-brand-500 hover:text-brand-900 transition-colors"
                >
                  <TwitterIcon size={16} />
                </a>
              )}
            </div>
          )}

        </div>

        {/* Footer Credit */}
        <div className="text-center pt-md">
          <p className="text-[9px] text-brand-400 tracking-wider uppercase font-mono">
            Powered by Qube Platform
          </p>
        </div>

      </div>
    </div>
  );
};

export default PublicVCard;
