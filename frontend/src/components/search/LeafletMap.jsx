import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';

export default function LeafletMap({ properties = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = [];

    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      const lat = parseFloat(p.latitude);
      const lng = parseFloat(p.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const priceK = Math.round((Number(p.pricePerNight) || 0) / 1000);
      const icon = L.divIcon({
        className: '',
        html: `<div class="map-price-pin">₹${priceK}k</div>`,
        iconAnchor: [30, 16],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      const popupHtml = `
        <div style="width:200px">
          ${p.images?.[0] ? `<img src="${p.images[0]}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px">` : ''}
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${p.title}</div>
          <div style="font-size:12px;color:#717171;margin-bottom:6px">${p.city}, ${p.state}</div>
          <div style="font-weight:700;font-size:14px;color:#FF385C">₹${Number(p.pricePerNight).toLocaleString('en-IN')} / night</div>
          <button id="map-popup-btn-${p.id}" style="width:100%;display:block;margin-top:8px;padding:8px;background:#222;color:white;text-align:center;border-radius:6px;font-size:13px;font-weight:600;border:none;cursor:pointer">View property</button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`map-popup-btn-${p.id}`);
        if (btn) {
          btn.onclick = () => navigate(`/properties/${p.id}`);
        }
      });

      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      // Map cleanup if needed on unmount
    };
  }, [properties, navigate]);

  return (
    <div
      id="map-view"
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '600px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}
    />
  );
}
