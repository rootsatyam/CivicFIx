// File: app/components/ReportIssueModal.js

'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A modal component for reporting civic issues.
 *
 * This component allows users to submit reports about various civic issues
 * such as potholes, garbage, water leaks, etc. It supports:
 * - Geolocation to automatically fetch the user's current location.
 * - Image upload for evidence.
 * - Categorization of issues.
 * - Emergency flagging for high-priority issues.
 * - Integration with Supabase for data persistence.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Function} props.onClose - A callback function to be executed when the modal needs to be closed.
 * @param {Function} [props.onIssueSubmitted] - An optional callback function to be executed after a successful issue submission.
 * @param {boolean} [props.defaultEmergency=false] - Sets the initial state of the emergency toggle. Defaults to false.
 * @returns {JSX.Element} The rendered ReportIssueModal component.
 */
export default function ReportIssueModal({ onClose, onIssueSubmitted, defaultEmergency = false }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [isEmergency, setIsEmergency] = useState(defaultEmergency);
  
  // SUCCESS STATE
  const [isSuccess, setIsSuccess] = useState(false);

  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  /**
   * Handles the retrieval of the user's current geolocation.
   *
   * It uses the browser's Geolocation API to get the coordinates and then
   * performs a reverse geocoding lookup using OpenStreetMap to get a human-readable address.
   *
   * @async
   * @function handleGetLocation
   * @returns {Promise<void>}
   */
  const handleGetLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setCoords({ lat, lng });
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        setLocation(data.display_name);
      } catch (err) {
        setLocation(`${lat}, ${lng}`);
      } finally { setLocationLoading(false); }
    });
  };

  /**
   * Handles the form submission.
   *
   * It uploads the selected image (if any) to Supabase Storage and then
   * inserts the issue data into the Supabase 'issues' table.
   *
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - The form event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) { setError('Login required.'); setUploading(false); return; }

    let imageUrl = null;
    if (file) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('issue-images').upload(filePath, file);
      if (!uploadError) {
         const { data: { publicUrl } } = supabase.storage.from('issue-images').getPublicUrl(filePath);
         imageUrl = publicUrl;
      }
    }

    const { error: insertError } = await supabase.from('issues').insert([{ 
          title, description, category, location, latitude: coords.lat, longitude: coords.lng, 
          submitted_by: user.id, image_url: imageUrl, is_emergency: isEmergency
      }]);

    setUploading(false);
    
    if (insertError) {
        setError(insertError.message);
    } else { 
        // TRIGGER SUCCESS ANIMATION
        setIsSuccess(true);
        
        // Wait 2 seconds, then close and refresh
        setTimeout(() => {
            if (onIssueSubmitted) onIssueSubmitted(); 
            onClose(); 
        }, 2000);
    }
  };

  const glassInput = `
    w-full p-4 rounded-xl 
    bg-black/30 border border-white/10 
    text-white placeholder-white/30 
    focus:outline-none focus:ring-2 focus:bg-black/50 transition duration-300
    ${isEmergency ? 'focus:ring-red-500/50' : 'focus:ring-blue-500/50'}
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`
            relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden
            max-h-[90vh] overflow-y-auto
            bg-slate-900/95 backdrop-blur-xl 
            border ${isEmergency ? 'border-red-500/30 shadow-red-900/40' : 'border-white/10 shadow-blue-900/40'}
        `}
      >
        <AnimatePresence mode='wait'>
            
            {/* VIEW 1: SUCCESS MESSAGE */}
            {isSuccess ? (
                <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-8 text-center"
                >
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/50">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <motion.path 
                                initial={{ pathLength: 0 }} 
                                animate={{ pathLength: 1 }} 
                                transition={{ duration: 0.5 }}
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                d="M5 13l4 4L19 7" 
                            />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Report Submitted</h3>
                    <p className="text-slate-400">Thank you for helping improve our city.</p>
                </motion.div>
            ) : (
                
            /* VIEW 2: THE FORM */
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                
                {/* HEADER */}
                <div className={`px-8 py-6 flex justify-between items-center border-b border-white/5 ${isEmergency ? 'bg-red-900/20' : 'bg-blue-900/20'}`}>
                    <div>
                        <h2 className={`text-2xl font-bold tracking-tight ${isEmergency ? 'text-red-400' : 'text-blue-400'}`}>
                            {isEmergency ? '🚨 EMERGENCY' : 'New Report'}
                        </h2>
                        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">CivicFix Reporting</p>
                    </div>
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition text-white/60 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                
                {/* EMERGENCY TOGGLE */}
                <div 
                    onClick={() => setIsEmergency(!isEmergency)}
                    className={`
                        group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300
                        ${isEmergency ? 'bg-red-900/20 border-red-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEmergency ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50'}`}>⚠️</div>
                        <div>
                            <h4 className={`font-bold text-sm ${isEmergency ? 'text-red-300' : 'text-white'}`}>High Priority / Hazard</h4>
                            <p className="text-xs text-white/40">Is this an immediate danger?</p>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isEmergency ? 'bg-red-500' : 'bg-white/20'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isEmergency ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-300/80 uppercase tracking-wider ml-1">Category</label>
                        <div className="relative">
                            <select value={category} onChange={(e) => setCategory(e.target.value)} required className={`${glassInput} appearance-none`}>
                                <option value="" className="bg-slate-900 text-slate-400">Select...</option>
                                <option value="Pothole" className="bg-slate-900">🚧 Pothole</option>
                                <option value="Garbage" className="bg-slate-900">🗑️ Garbage</option>
                                <option value="Water" className="bg-slate-900">💧 Water Leak</option>
                                <option value="Electricity" className="bg-slate-900">⚡ Electricity</option>
                                <option value="Accident" className="bg-slate-900">🚑 Accident</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-300/80 uppercase tracking-wider ml-1">Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Title" className={glassInput} />
                    </div>
                </div>

                {/* LOCATION */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-300/80 uppercase tracking-wider ml-1">Exact Location</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)} 
                            required 
                            placeholder="Address..." 
                            className={`${glassInput} pr-24`} 
                        />
                        <button 
                            type="button" 
                            onClick={handleGetLocation} 
                            disabled={locationLoading}
                            className={`absolute right-2 top-2 bottom-2 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wide transition flex items-center gap-1 
                                ${isEmergency ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}
                            `}
                        >
                            {locationLoading ? <span className="animate-spin">↻</span> : '📍 GPS'}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-300/80 uppercase tracking-wider ml-1">Details</label>
                    <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe..." className={`${glassInput} resize-none`}></textarea>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-300/80 uppercase tracking-wider ml-1">Photo Evidence</label>
                    <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="w-full p-2 bg-white/5 rounded-xl border border-white/10 text-xs text-white/70 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white" />
                </div>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                <button type="submit" disabled={uploading} className={`w-full py-4 font-bold text-white rounded-xl shadow-lg hover:scale-[1.02] transition transform ${isEmergency ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
                    {uploading ? 'TRANSMITTING...' : 'SUBMIT REPORT'}
                </button>

                </form>
            </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}