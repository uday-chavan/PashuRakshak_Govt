/**
 * LeafletMapView — Drop-in replacement for GoogleMapsView.
 * Uses Leaflet.js + ESRI World Imagery satellite tiles (free, no API key).
 * Bundles local Maharashtra districts GeoJSON for guaranteed, instant border rendering.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LeafletMapView.css';
import maharashtraGeoJson from '../data/maharashtra_districts.json';
import {
  DISTRICT_COORDINATES,
  MAHARASHTRA_CENTER,
  MAHARASHTRA_DEFAULT_ZOOM,
  normalizeDistrictName,
  matchDistrict,
} from '../data/maharashtraGeo.js';
import { Globe, Layers, Maximize2, Activity, Radio, Compass, Shield } from 'lucide-react';

// Fix Leaflet default icon path issue with Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Tile layer configs
const TILES = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri World Imagery',
    label: 'Satellite',
  },
  labels: {
    url: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
  },
  roadmap: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CartoDB',
    label: 'Map',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap contributors',
    label: 'Terrain',
  },
};

const RISK_COLORS = {
  critical: '#DC2626',
  warning:  '#D97706',
  normal:   '#059669',
  none:     '#6B7280',
};

// Build an SVG pin icon for districts
function districtIcon(risk, isSelected) {
  const color = RISK_COLORS[risk] || RISK_COLORS.normal;
  const size = isSelected ? 32 : 24;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" width="${size}" height="${size}">
      <path d="M12 0C7.58 0 4 3.58 4 8c0 7 8 18 8 18S20 15 20 8c0-4.42-3.58-8-8-8z"
        fill="${color}" stroke="white" stroke-width="${isSelected ? 2 : 1.5}" opacity="0.95"/>
      <circle cx="12" cy="8.5" r="3.5" fill="white" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Diamond pin icon for individual cases
function caseIcon(status) {
  const colorMap = {
    'Active':          '#DC2626',
    'Under Treatment': '#F59E0B',
    'Pending':         '#6366F1',
    'Resolved':        '#10B981',
  };
  const labelMap = { 'Active': 'A', 'Under Treatment': 'T', 'Pending': 'P', 'Resolved': 'R' };
  const color = colorMap[status] || '#6B7280';
  const label = labelMap[status] || '?';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 20 20" width="20" height="20">
      <polygon points="0,-8 8,0 0,8 -8,0" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.95"/>
      <text x="0" y="3.5" text-anchor="middle" font-size="7" font-weight="bold" fill="white">${label}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

export default function LeafletMapView({
  districts = [],
  casePins = [],
  selected = null,
  onSelect = null,
  mode = 'risk',
  height = 500,
  showControls = true,
  storageKey = 'pashurakshak_map_view',
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const labelsLayerRef = useRef(null);
  const markersRef = useRef([]);
  const districtPolygonRef = useRef(null);    // selected district highlight
  const allBordersLayerRef = useRef(null);    // all 36 district outlines
  const bufferCirclesRef = useRef([]);
  const isFirstMountRef = useRef(true);
  const prevSelectedRef = useRef(selected);

  const [tileMode, setTileMode] = useState(() => {
    try {
      return localStorage.getItem('pashurakshak_map_tilemode') || 'satellite';
    } catch {
      return 'satellite';
    }
  });
  const [showLabels, setShowLabels] = useState(() => {
    try {
      const s = localStorage.getItem('pashurakshak_map_labels');
      return s !== null ? s === 'true' : true;
    } catch {
      return true;
    }
  });
  const [showBorders, setShowBorders] = useState(() => {
    try {
      const s = localStorage.getItem('pashurakshak_map_borders');
      return s !== null ? s === 'true' : true;
    } catch {
      return true;
    }
  });
  const [showBufferZones, setShowBufferZones] = useState(() => {
    try {
      const s = localStorage.getItem('pashurakshak_map_buffer');
      return s !== null ? s === 'true' : true;
    } catch {
      return true;
    }
  });

  // Persist layer toggle preferences
  useEffect(() => {
    try { localStorage.setItem('pashurakshak_map_tilemode', tileMode); } catch {}
  }, [tileMode]);

  useEffect(() => {
    try { localStorage.setItem('pashurakshak_map_labels', String(showLabels)); } catch {}
  }, [showLabels]);

  useEffect(() => {
    try { localStorage.setItem('pashurakshak_map_borders', String(showBorders)); } catch {}
  }, [showBorders]);

  useEffect(() => {
    try { localStorage.setItem('pashurakshak_map_buffer', String(showBufferZones)); } catch {}
  }, [showBufferZones]);

  // ── Apply all district borders from GeoJSON ───────────────────────────────
  const applyAllBorders = useCallback((map) => {
    if (!map || !maharashtraGeoJson) return;

    if (allBordersLayerRef.current) {
      allBordersLayerRef.current.remove();
      allBordersLayerRef.current = null;
    }

    if (!showBorders) return;

    // Single unified district borders layer — clean, static, and crisp
    allBordersLayerRef.current = L.geoJSON(maharashtraGeoJson, {
      style: () => ({
        color: '#38bdf8',          // clear, crisp cyan-blue border
        weight: 1.6,
        opacity: 0.85,
        fill: false,
      }),
      onEachFeature: (feature, layer) => {
        const rawName = feature.properties?.district || feature.properties?.District || feature.properties?.NAME_2 || feature.properties?.name || '';
        const name = normalizeDistrictName(rawName);

        layer.bindTooltip(name, {
          sticky: true,
          className: 'lmap-district-tooltip',
          direction: 'top',
          offset: [0, -10],
        });

        layer.on({
          click: () => {
            if (onSelect) {
              const matched = districts.find((d) => matchDistrict(d.district || d.name, name));
              onSelect(matched || name);
            }
          },
        });
      },
    }).addTo(map);

    if (allBordersLayerRef.current) allBordersLayerRef.current.bringToFront();
  }, [showBorders, onSelect, districts]);

  // ── Init map once ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    let initialCenter = [MAHARASHTRA_CENTER.lat, MAHARASHTRA_CENTER.lng];
    let initialZoom = MAHARASHTRA_DEFAULT_ZOOM;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.lat === 'number' &&
          !isNaN(parsed.lat) &&
          typeof parsed.lng === 'number' &&
          !isNaN(parsed.lng) &&
          typeof parsed.zoom === 'number' &&
          !isNaN(parsed.zoom)
        ) {
          initialCenter = [parsed.lat, parsed.lng];
          initialZoom = parsed.zoom;
        }
      }
    } catch {}

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Save map view on user interaction (pan / zoom)
    const handleViewChange = () => {
      if (!map) return;
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        if (center && typeof zoom === 'number') {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ lat: center.lat, lng: center.lng, zoom })
          );
        }
      } catch {}
    };

    map.on('moveend', handleViewChange);
    map.on('zoomend', handleViewChange);

    // Add zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Satellite base tile
    tileLayerRef.current = L.tileLayer(TILES.satellite.url, {
      attribution: TILES.satellite.attribution,
      maxZoom: 19,
    }).addTo(map);

    // Labels overlay (on top of satellite)
    labelsLayerRef.current = L.tileLayer(TILES.labels.url, {
      attribution: TILES.labels.attribution,
      maxZoom: 19,
      opacity: 0.85,
    }).addTo(map);

    mapRef.current = map;

    // Render district & state borders immediately from bundled GeoJSON
    applyAllBorders(map);

    return () => {
      map.off('moveend', handleViewChange);
      map.off('zoomend', handleViewChange);
      map.remove();
      mapRef.current = null;
      allBordersLayerRef.current = null;
    };
  }, [applyAllBorders, storageKey]);

  // ── Update borders when showBorders changes ────────────────────────────────
  useEffect(() => {
    if (mapRef.current) {
      applyAllBorders(mapRef.current);
    }
  }, [showBorders, applyAllBorders]);

  // ── Tile mode switch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (tileLayerRef.current) { tileLayerRef.current.remove(); }
    if (labelsLayerRef.current) { labelsLayerRef.current.remove(); }

    if (tileMode === 'satellite') {
      tileLayerRef.current = L.tileLayer(TILES.satellite.url, {
        attribution: TILES.satellite.attribution, maxZoom: 19,
      }).addTo(map);
      if (showLabels) {
        labelsLayerRef.current = L.tileLayer(TILES.labels.url, {
          attribution: TILES.labels.attribution, maxZoom: 19, opacity: 0.85,
        }).addTo(map);
      } else {
        labelsLayerRef.current = null;
      }
    } else if (tileMode === 'roadmap') {
      tileLayerRef.current = L.tileLayer(TILES.roadmap.url, {
        attribution: TILES.roadmap.attribution, maxZoom: 19,
      }).addTo(map);
      labelsLayerRef.current = null;
    } else if (tileMode === 'terrain') {
      tileLayerRef.current = L.tileLayer(TILES.terrain.url, {
        attribution: TILES.terrain.attribution, maxZoom: 17,
      }).addTo(map);
      labelsLayerRef.current = null;
    }

    // Keep border layers above base tiles
    if (allBordersLayerRef.current) allBordersLayerRef.current.bringToFront();
    if (districtPolygonRef.current) districtPolygonRef.current.bringToFront();
  }, [tileMode, showLabels]);

  // ── Render dynamic layers (markers, lines, buffer circles) ──────────────────
  const renderLayers = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear old markers and circles
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    bufferCirclesRef.current.forEach((c) => c.remove());
    bufferCirclesRef.current = [];

    // 1. Case pin markers (diamond) — lower z-index
    casePins.forEach((pin) => {
      if (!pin.lat || !pin.lng) return;
      const marker = L.marker([pin.lat, pin.lng], {
        icon: caseIcon(pin.status),
        zIndexOffset: 100,
        title: `${pin.caseRef} — ${pin.animal}`,
      }).addTo(map);

      const caseHtml = `
        <div class="lmap-infowindow">
          <div class="lmap-info-header">
            <div class="lmap-info-title">${pin.caseRef}</div>
            <span class="lmap-badge lmap-badge-case">${pin.status}</span>
          </div>
          <div class="lmap-info-body">
            <div class="lmap-stat-row"><span class="label">Animal:</span><span class="val">${pin.animal}</span></div>
            <div class="lmap-stat-row"><span class="label">Disease:</span><span class="val danger">${pin.disease || 'Suspected'}</span></div>
            <div class="lmap-stat-row"><span class="label">Village:</span><span class="val">${pin.village || '—'}, ${pin.district}</span></div>
            <div class="lmap-stat-row"><span class="label">Vet:</span><span class="val">${pin.vet || '—'}</span></div>
          </div>
        </div>`;

      marker.bindPopup(caseHtml, { className: 'lmap-popup', maxWidth: 240 });
      markersRef.current.push(marker);
    });

    // 2. District centroid markers — always on top of case pins
    districts.forEach((dist) => {
      const distName  = dist.district || dist.name || '';
      const canonical = normalizeDistrictName(distName);
      const coordObj  =
        (dist.latitude && dist.longitude && !isNaN(parseFloat(dist.latitude)))
          ? { lat: parseFloat(dist.latitude), lng: parseFloat(dist.longitude) }
          : (DISTRICT_COORDINATES[distName] || DISTRICT_COORDINATES[canonical]);
      if (!coordObj) return;

      const risk       = (dist.risk || 'normal').toLowerCase();
      const isSelected = selected && matchDistrict(selected, distName);
      const color      = RISK_COLORS[risk] || RISK_COLORS.normal;

      // Buffer ring for critical / warning
      if (showBufferZones && (risk === 'critical' || risk === 'warning')) {
        const radiusM = risk === 'critical' ? 32000 : 20000;
        const circle  = L.circle([coordObj.lat, coordObj.lng], {
          radius: radiusM,
          color,
          fillColor: color,
          fillOpacity: risk === 'critical' ? 0.12 : 0.07,
          weight: 1,
          dashArray: '4,3',
        }).addTo(map);
        bufferCirclesRef.current.push(circle);
      }

      const marker = L.marker([coordObj.lat, coordObj.lng], {
        icon: districtIcon(risk, isSelected),
        zIndexOffset: isSelected ? 3000 : 2000,
        title: distName,
      }).addTo(map);

      // Popup content
      const popupHtml = `
        <div class="lmap-infowindow">
          <div class="lmap-info-header">
            <div class="lmap-info-title">${distName}</div>
            <span class="lmap-badge lmap-badge-${risk}">${risk.toUpperCase()}</span>
          </div>
          <div class="lmap-info-body">
            <div class="lmap-stat-row"><span class="label">Disease:</span><span class="val">${dist.disease || 'N/A'}</span></div>
            <div class="lmap-stat-row"><span class="label">Affected Animals:</span><span class="val danger">${dist.affectedAnimals || dist.affected || 0}</span></div>
            <div class="lmap-stat-row"><span class="label">Active Villages:</span><span class="val">${dist.activeVillages || '—'}</span></div>
            <div class="lmap-stat-row"><span class="label">Vaccination:</span><span class="val success">${dist.vaccinationCoverage || 0}%</span></div>
          </div>
        </div>`;

      marker.bindPopup(popupHtml, { className: 'lmap-popup', maxWidth: 260 });

      marker.on('click', () => {
        if (onSelect) onSelect(dist);
      });

      markersRef.current.push(marker);
    });
  }, [districts, casePins, selected, showBufferZones, onSelect]);

  useEffect(() => {
    renderLayers();
    // Keep borders above markers/circles
    setTimeout(() => {
      if (allBordersLayerRef.current) allBordersLayerRef.current.bringToFront();
      if (districtPolygonRef.current) districtPolygonRef.current.bringToFront();
    }, 0);
  }, [renderLayers]);

  // ── District boundary polygon when selected ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove existing highlighted polygon
    if (districtPolygonRef.current) {
      districtPolygonRef.current.remove();
      districtPolygonRef.current = null;
    }

    if (!selected) {
      // Only reset view to default if this is NOT initial mount AND user actually had a selection before
      if (!isFirstMountRef.current && prevSelectedRef.current) {
        map.setView([MAHARASHTRA_CENTER.lat, MAHARASHTRA_CENTER.lng], MAHARASHTRA_DEFAULT_ZOOM);
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              lat: MAHARASHTRA_CENTER.lat,
              lng: MAHARASHTRA_CENTER.lng,
              zoom: MAHARASHTRA_DEFAULT_ZOOM,
            })
          );
        } catch {}
      }
      prevSelectedRef.current = selected;
      isFirstMountRef.current = false;
      return;
    }

    prevSelectedRef.current = selected;
    isFirstMountRef.current = false;

    const canonicalSelected = normalizeDistrictName(
      typeof selected === 'string' ? selected : (selected.district || selected.name || '')
    ).toLowerCase();

    if (maharashtraGeoJson?.features) {
      const feature = maharashtraGeoJson.features.find((f) => {
        const p = f.properties || {};
        const raw = p.DISTRICT || p.district || p.NAME_2 || p.NAME || p.name || '';
        return normalizeDistrictName(raw).toLowerCase() === canonicalSelected;
      });

      if (feature) {
        const layer = L.geoJSON(feature, {
          style: {
            color: '#10b981',
            weight: 3.5,
            opacity: 1,
            fillColor: '#10b981',
            fillOpacity: 0.22,
          },
        }).addTo(map);

        districtPolygonRef.current = layer;
        layer.bringToFront();

        // Smoothly fit map to district boundary
        try {
          map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 11 });
        } catch {
          const coord = DISTRICT_COORDINATES[selected] || DISTRICT_COORDINATES[normalizeDistrictName(selected)];
          if (coord) map.setView([coord.lat, coord.lng], 10);
        }
        return;
      }
    }

    // Centroid fallback if no feature matched
    const coord = DISTRICT_COORDINATES[selected] || DISTRICT_COORDINATES[normalizeDistrictName(selected)];
    if (coord) map.setView([coord.lat, coord.lng], 10);
  }, [selected, storageKey]);

  const resetView = useCallback(() => {
    if (mapRef.current) {
      if (districtPolygonRef.current) {
        districtPolygonRef.current.remove();
        districtPolygonRef.current = null;
      }
      mapRef.current.setView([MAHARASHTRA_CENTER.lat, MAHARASHTRA_CENTER.lng], MAHARASHTRA_DEFAULT_ZOOM);
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            lat: MAHARASHTRA_CENTER.lat,
            lng: MAHARASHTRA_CENTER.lng,
            zoom: MAHARASHTRA_DEFAULT_ZOOM,
          })
        );
      } catch {}
      if (onSelect) onSelect(null);
    }
  }, [onSelect, storageKey]);

  // ── Escape key listener to deselect and return to default map view ──────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        resetView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetView]);

  return (
    <div className="lmap-wrapper" style={{ height: `${height}px` }}>
      {/* Controls */}
      {showControls && (
        <div className="lmap-controls">
          <div className="lmap-btn-group">
            <button
              type="button"
              className={`lmap-btn ${tileMode === 'satellite' ? 'active' : ''}`}
              onClick={() => setTileMode('satellite')}
              title="ESRI Satellite imagery"
            >
              <Globe size={13} />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              className={`lmap-btn ${tileMode === 'roadmap' ? 'active' : ''}`}
              onClick={() => setTileMode('roadmap')}
              title="Road map view"
            >
              <Layers size={13} />
              <span>Map</span>
            </button>
            <button
              type="button"
              className={`lmap-btn ${tileMode === 'terrain' ? 'active' : ''}`}
              onClick={() => setTileMode('terrain')}
              title="Terrain & Topography"
            >
              <Compass size={13} />
              <span>Terrain</span>
            </button>
          </div>

          <div className="lmap-btn-group">
            <button
              type="button"
              className={`lmap-btn ${showBorders ? 'active' : ''}`}
              onClick={() => setShowBorders((v) => !v)}
              title="Toggle all 36 district borders"
            >
              <Shield size={13} />
              <span>Borders {showBorders ? 'ON' : 'OFF'}</span>
            </button>
            {tileMode === 'satellite' && (
              <button
                type="button"
                className={`lmap-btn ${showLabels ? 'active' : ''}`}
                onClick={() => setShowLabels((v) => !v)}
                title="Toggle place labels"
              >
                <Activity size={13} />
                <span>Labels {showLabels ? 'ON' : 'OFF'}</span>
              </button>
            )}
            <button
              type="button"
              className={`lmap-btn ${showBufferZones ? 'active' : ''}`}
              onClick={() => setShowBufferZones((v) => !v)}
              title="Toggle containment buffer rings"
            >
              <Radio size={13} />
              <span>Rings</span>
            </button>
            <button
              type="button"
              className="lmap-btn"
              onClick={resetView}
              title="Reset to Maharashtra overview"
            >
              <Maximize2 size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Map canvas */}
      <div ref={mapContainerRef} className="lmap-canvas" style={{ height: '100%' }} />

      {/* Status pill */}
      <div className="lmap-status">
        <span className="lmap-live-dot" />
        ESRI Satellite · Maharashtra · {districts.length || 36} Districts
      </div>
    </div>
  );
}
