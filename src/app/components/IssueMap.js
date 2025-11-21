// File: app/components/IssueMap.js
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react'; // Import useEffect

/**
 * A map component that displays reported civic issues using Leaflet.
 *
 * This component renders an interactive map with markers representing the location
 * of reported issues. It handles:
 * - Rendering a map using `react-leaflet`.
 * - Displaying markers for each issue.
 * - Showing a popup with issue details when a marker is clicked.
 * - Fixing default icon issues associated with Leaflet in React.
 * - Providing a fallback mechanism for issues with missing coordinates.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Array<Object>} props.issues - An array of issue objects to be displayed on the map.
 * @param {number} props.issues[].id - The unique identifier of the issue.
 * @param {number} [props.issues[].latitude] - The latitude of the issue.
 * @param {number} [props.issues[].longitude] - The longitude of the issue.
 * @param {string} props.issues[].title - The title of the issue.
 * @param {string} props.issues[].category - The category of the issue.
 * @param {string} props.issues[].status - The status of the issue (e.g., 'Resolved', 'Pending').
 * @returns {JSX.Element} The rendered IssueMap component.
 */
export default function IssueMap({ issues }) {
  const center = [23.3441, 85.3096]; 

  // FIX: Move the icon logic INSIDE the component, inside useEffect
  useEffect(() => {
    // This code only runs in the browser, fixing the "window" error
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  // Define the icon AFTER the useEffect has potentially merged options
  const customIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner z-0 relative">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {issues.map((issue) => {
          // 1. Use Real DB Coordinates if available
          let lat = issue.latitude;
          let lng = issue.longitude;

          // 2. Fallback: If old data has no GPS, use the simulation logic
          if (!lat || !lng) {
              const offset = (issue.id % 10) * 0.01; 
              lat = center[0] + (Math.random() * 0.05 - 0.025); 
              lng = center[1] + (Math.random() * 0.05 - 0.025);
          }

          return (
            <Marker key={issue.id} position={[lat, lng]} icon={customIcon}>
              <Popup>
                <div className="p-1">
                    <h3 className="font-bold text-sm">{issue.title}</h3>
                    <p className="text-xs text-gray-600">{issue.category}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded text-white ${issue.status === 'Resolved' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        {issue.status}
                    </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}