import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  DISTRICT_COORDINATES,
  MAHARASHTRA_CENTER,
  MAHARASHTRA_DEFAULT_ZOOM,
  normalizeDistrictName,
  matchDistrict,
} from '../data/maharashtraGeo.js';
import {
  Globe,
  Layers,
  Maximize2,
  Key,
  AlertTriangle,
  Activity,
  Compass,
  Radio,
  RefreshCw,
} from 'lucide-react';
import './GoogleMapsView.css';

const RISK_COLORS = {
  critical: { fill: '#DC2626', stroke: '#991B1B', text: '#FFFFFF', ring: 'rgba(220, 38, 38, 0.4)' },
  warning: { fill: '#D97706', stroke: '#92400E', text: '#FFFFFF', ring: 'rgba(217, 119, 6, 0.4)' },
  normal: { fill: '#059669', stroke: '#065F46', text: '#FFFFFF', ring: 'rgba(5, 150, 105, 0.3)' },
  none: { fill: '#6B7280', stroke: '#374151', text: '#FFFFFF', ring: 'rgba(107, 114, 128, 0.2)' },
};

// ─── Module-level singletons so re-renders never double-inject ───────────────
let _gmapsPromise = null;   // resolves once google.maps is ready
let _gmapsAuthFailed = false; // sticky flag set by gm_authFailure

// Register auth-failure ONCE at module load time so it's never missed
// regardless of when React mounts the component.
window.gm_authFailure = () => {
  console.warn('[GoogleMapsView] gm_authFailure — API key invalid or Maps JS API not enabled');
  _gmapsAuthFailed = true;
  window.dispatchEvent(new CustomEvent('gmaps_auth_failure'));
};

/**
 * Loads the Google Maps JS API exactly once per page lifetime.
 * Returns a Promise that resolves to window.google or rejects on error/timeout.
 */
function loadGoogleMapsScript(apiKey) {
  // If auth already failed on a previous load, reject immediately
  if (_gmapsAuthFailed) {
    return Promise.reject(new Error('gm_authFailure — API key invalid or Maps JS API not enabled'));
  }

  // If google.maps is already available (cached from previous session), resolve now
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  // Return the in-progress or cached promise so multiple callers share one load
  if (_gmapsPromise) return _gmapsPromise;

  _gmapsPromise = new Promise((resolve, reject) => {
    // Timeout safety-net: if Google never responds in 15 s, fail gracefully
    const timeoutId = setTimeout(() => {
      reject(new Error('Google Maps script load timed out after 15 seconds'));
      _gmapsPromise = null;
    }, 15_000);

    const done = (ok, errMsg) => {
      clearTimeout(timeoutId);
      if (ok) {
        resolve(window.google);
      } else {
        _gmapsPromise = null;
        reject(new Error(errMsg || 'Google Maps failed to load'));
      }
    };

    // If an auth failure fires while we are waiting, fail immediately
    const onAuthFail = () => done(false, 'gm_authFailure — API key invalid or Maps JS API not enabled');
    window.addEventListener('gmaps_auth_failure', onAuthFail, { once: true });

    // If the script tag was already injected (hot-reload / StrictMode), check its state
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      // Script already fully loaded — resolve straight away
      if (window.google?.maps) {
        window.removeEventListener('gmaps_auth_failure', onAuthFail);
        done(true);
        return;
      }
      // Script tag exists but hasn't finished yet — piggy-back on its events
      existing.addEventListener('load', () => {
        window.removeEventListener('gmaps_auth_failure', onAuthFail);
        if (window.google?.maps) done(true);
        else done(false, 'Script loaded but google.maps is undefined');
      }, { once: true });
      existing.addEventListener('error', () => {
        window.removeEventListener('gmaps_auth_failure', onAuthFail);
        done(false, 'Google Maps script network error');
      }, { once: true });
      return;
    }

    // First load — create and inject the script tag
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;

    script.onload = () => {
      window.removeEventListener('gmaps_auth_failure', onAuthFail);
      // Small tick to let gm_authFailure fire if it was going to
      setTimeout(() => {
        if (_gmapsAuthFailed) {
          done(false, 'gm_authFailure — API key invalid or Maps JS API not enabled');
        } else if (window.google?.maps) {
          done(true);
        } else {
          done(false, 'Script loaded but google.maps is undefined');
        }
      }, 100);
    };

    script.onerror = () => {
      window.removeEventListener('gmaps_auth_failure', onAuthFail);
      done(false, 'Google Maps script failed to download (network error or blocked)');
    };

    document.head.appendChild(script);
  });

  return _gmapsPromise;
}


export default function GoogleMapsView({
  districts = [],
  casePins = [],
  selected = null,
  onSelect = null,
  mode = 'risk',
  connections = [],
  height = 500,
  showControls = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  const polylinesRef = useRef([]);
  const infoWindowRef = useRef(null);
  // District boundary GeoJSON overlay
  const geoJsonCacheRef = useRef(null);      // cached full FeatureCollection
  const districtLayerFeaturesRef = useRef([]); // currently rendered Data features

  const [apiKey, setApiKey] = useState(() => {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('PR_GMAPS_KEY') || '';
  });
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [mapType, setMapType] = useState('hybrid'); // 'hybrid' | 'roadmap' | 'terrain'
  const [showBufferZones, setShowBufferZones] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [is3D, setIs3D] = useState(true);
  const [loadStatus, setLoadStatus] = useState('loading'); // 'loading' | 'ready' | 'error' | 'no-key'
  const [errorMessage, setErrorMessage] = useState('');

  // Listen for Google Maps auth errors — also catches any failure that already
  // happened before this component mounted (checked via module-level flag).
  useEffect(() => {
    // Already failed before this mount? Show error immediately.
    if (_gmapsAuthFailed) {
      setErrorMessage('Google Maps API key invalid or Maps JavaScript API not enabled.');
      setLoadStatus('error');
      return;
    }
    const handleAuthFail = () => {
      setErrorMessage('Google Maps API key invalid or Maps JavaScript API not enabled.');
      setLoadStatus('error');
    };
    window.addEventListener('gmaps_auth_failure', handleAuthFail);
    return () => window.removeEventListener('gmaps_auth_failure', handleAuthFail);
  }, []);

  // Save new key — also resets the module-level singleton so the fresh key
  // gets a clean load attempt instead of reusing the failed promise.
  const handleSaveKey = (e) => {
    e?.preventDefault();
    const cleanKey = tempKeyInput.trim();
    if (!cleanKey) return;
    localStorage.setItem('PR_GMAPS_KEY', cleanKey);
    // Reset module-level singletons so next loadGoogleMapsScript call is fresh
    _gmapsAuthFailed = false;
    _gmapsPromise = null;
    // Remove old script tag so the new key's script is injected
    const old = document.getElementById('google-maps-script');
    if (old) old.remove();
    delete window.google;
    setApiKey(cleanKey);
    setLoadStatus('loading');
  };

  // Initialize Map
  useEffect(() => {
    if (!apiKey) {
      setLoadStatus('no-key');
      return;
    }

    // Auth already failed (sticky module flag) — skip straight to error UI
    if (_gmapsAuthFailed) {
      setErrorMessage('Google Maps API key invalid or Maps JavaScript API not enabled.');
      setLoadStatus('error');
      return;
    }

    // If the map is already rendered in this container, skip re-init
    if (mapInstanceRef.current) {
      setLoadStatus('ready');
      return;
    }

    let isMounted = true;
    setLoadStatus('loading');

    loadGoogleMapsScript(apiKey)
      .then((google) => {
        if (!isMounted || !mapContainerRef.current) return;
        // Double-check auth didn't fail during async load
        if (_gmapsAuthFailed) {
          setErrorMessage('Google Maps API key invalid or Maps JavaScript API not enabled.');
          setLoadStatus('error');
          return;
        }
        try {
          const map = new google.maps.Map(mapContainerRef.current, {
            center: MAHARASHTRA_CENTER,
            zoom: MAHARASHTRA_DEFAULT_ZOOM,
            mapTypeId: mapType,
            heading: 0,
            tilt: is3D ? 45 : 0,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            zoomControlOptions: {
              position: google.maps.ControlPosition.RIGHT_BOTTOM,
            },
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          });

          mapInstanceRef.current = map;
          infoWindowRef.current = new google.maps.InfoWindow();

          map.addListener('click', () => {
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }
          });

          if (isMounted) setLoadStatus('ready');
        } catch (err) {
          console.error('Error initializing map instance:', err);
          if (isMounted) {
            setErrorMessage(err.message || 'Error rendering Google Map');
            setLoadStatus('error');
          }
        }
      })
      .catch((err) => {
        console.error('[GoogleMapsView] Load failed:', err.message);
        if (isMounted) {
          setErrorMessage(err.message || 'Could not load Google Maps. Check your API key or network.');
          setLoadStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Update map type and tilt
  useEffect(() => {
    if (mapInstanceRef.current && window.google?.maps) {
      mapInstanceRef.current.setMapTypeId(mapType);
      mapInstanceRef.current.setTilt(is3D ? 45 : 0);
    }
  }, [mapType, is3D]);

  // Render Overlays, Custom Markers, Circles & Polylines
  const renderMapLayers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google?.maps || loadStatus !== 'ready') return;
    const map = mapInstanceRef.current;
    const google = window.google;

    // Clear existing
    markersRef.current.forEach((m) => m?.setMap?.(null));
    markersRef.current = [];
    circlesRef.current.forEach((c) => c?.setMap?.(null));
    circlesRef.current = [];
    polylinesRef.current.forEach((p) => p?.setMap?.(null));
    polylinesRef.current = [];

    // 1. Draw Outbreak Connections
    if (showConnections && connections && connections.length > 0) {
      connections.forEach((conn) => {
        const fromCoord = DISTRICT_COORDINATES[conn.from];
        const toCoord = DISTRICT_COORDINATES[conn.to];
        if (fromCoord && toCoord) {
          const line = new google.maps.Polyline({
            path: [fromCoord, toCoord],
            geodesic: true,
            strokeColor: '#38BDF8',
            strokeOpacity: 0.8,
            strokeWeight: 2.5,
            map: map,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: '#0284C7',
                  fillColor: '#38BDF8',
                  fillOpacity: 1,
                },
                offset: '50%',
              },
            ],
          });
          polylinesRef.current.push(line);
        }
      });
    }

    // 2. Add District Markers & Buffer Circles
    districts.forEach((dist) => {
      const distName = dist.district || dist.name;
      const canonical = normalizeDistrictName(distName);
      const coord = (dist.latitude && dist.longitude && !isNaN(parseFloat(dist.latitude)))
        ? { lat: parseFloat(dist.latitude), lng: parseFloat(dist.longitude) }
        : (DISTRICT_COORDINATES[distName] || DISTRICT_COORDINATES[canonical] || null);
      if (!coord) return;

      const risk = (dist.risk || 'normal').toLowerCase();
      const riskCfg = RISK_COLORS[risk] || RISK_COLORS.normal;
      const isSelected = selected && (selected === distName || matchDistrict(selected, distName));

      // Ring Vaccination / Hotspot Buffer Zone
      if (showBufferZones && (dist.risk === 'critical' || dist.risk === 'warning')) {
        const radiusMeters = dist.risk === 'critical' ? 32000 : 20000;
        const circle = new google.maps.Circle({
          strokeColor: riskCfg.fill,
          strokeOpacity: 0.85,
          strokeWeight: 1.5,
          fillColor: riskCfg.fill,
          fillOpacity: dist.risk === 'critical' ? 0.22 : 0.14,
          map: map,
          center: coord,
          radius: radiusMeters,
          clickable: false,
        });
        circlesRef.current.push(circle);
      }

      // Marker Icon creation
      let markerBadge = dist.disease ? String(dist.disease) : '';
      if (mode === 'vaccination') {
        markerBadge = `${dist.vaccinationCoverage || 0}%`;
      }

      const svgMarker = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
        fillColor: mode === 'vaccination' ? '#059669' : riskCfg.fill,
        fillOpacity: 1,
        strokeWeight: isSelected ? 3 : 1.5,
        strokeColor: '#FFFFFF',
        scale: isSelected ? 1.7 : 1.35,
        anchor: new google.maps.Point(12, 22),
        labelOrigin: new google.maps.Point(12, 9),
      };

      const marker = new google.maps.Marker({
        position: coord,
        map: map,
        title: dist.district,
        icon: svgMarker,
        zIndex: isSelected ? 3000 : 2000,
        label: {
          text: markerBadge ? String(markerBadge).slice(0, 4) : '',
          color: '#ffffff',
          fontSize: isSelected ? '11px' : '9px',
          fontWeight: 'bold',
        },
      });

      // InfoWindow HTML
      const contentString = `
        <div class="gmap-infowindow">
          <div class="gmap-info-header">
            <div class="gmap-info-title">${dist.district}</div>
            <span class="gmap-badge gmap-badge-${risk}">${risk.toUpperCase()}</span>
          </div>
          <div class="gmap-info-body">
            <div class="gmap-stat-row">
              <span class="label">Disease:</span>
              <span class="val font-bold">${dist.disease || 'N/A'}</span>
            </div>
            <div class="gmap-stat-row">
              <span class="label">Affected Animals:</span>
              <span class="val text-danger font-bold">${dist.affectedAnimals || dist.affected || 0}</span>
            </div>
            <div class="gmap-stat-row">
              <span class="label">Active Villages:</span>
              <span class="val">${dist.activeVillages || '—'}</span>
            </div>
            <div class="gmap-stat-row">
              <span class="label">Vaccination:</span>
              <span class="val text-success font-bold">${dist.vaccinationCoverage || 0}%</span>
            </div>
            <div class="gmap-stat-row">
              <span class="label">Trend:</span>
              <span class="val">${dist.riskTrend || 'Stable'}</span>
            </div>
            <div class="gmap-stat-row">
              <span class="label">Last Report:</span>
              <span class="val text-muted">${dist.lastReported || 'Recent'}</span>
            </div>
          </div>
        </div>
      `;

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(map, marker);
        }
        if (onSelect) {
          onSelect(dist);
        }
      });

      markersRef.current.push(marker);
    });

    // 3. Add DB Case Pins (blue square markers for individual cases)
    const STATUS_PIN_COLORS = {
      'Active':          { fill: '#DC2626', label: 'A' },
      'Under Treatment': { fill: '#F59E0B', label: 'T' },
      'Pending':         { fill: '#6366F1', label: 'P' },
      'Resolved':        { fill: '#10B981', label: 'R' },
    };

    casePins.forEach((pin) => {
      const lat = typeof pin.lat === 'number' ? pin.lat : parseFloat(pin.lat);
      const lng = typeof pin.lng === 'number' ? pin.lng : parseFloat(pin.lng);
      if (isNaN(lat) || isNaN(lng)) return;
      const cfg = STATUS_PIN_COLORS[pin.status] || { fill: '#DC2626', label: 'C' };

      const pinIcon = {
        path: 'M 0,-8 8,0 0,8 -8,0 Z', // diamond shape
        fillColor: cfg.fill,
        fillOpacity: 0.95,
        strokeColor: '#ffffff',
        strokeWeight: 1.5,
        scale: 1.2,
        anchor: new google.maps.Point(0, 0),
        labelOrigin: new google.maps.Point(0, 0),
      };

      const caseMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `${pin.caseRef} — ${pin.animal} (${pin.district})`,
        icon: pinIcon,
        label: {
          text: cfg.label,
          color: '#ffffff',
          fontSize: '9px',
          fontWeight: 'bold',
        },
        zIndex: 50,
      });

      const caseInfo = `
        <div class="gmap-infowindow">
          <div class="gmap-info-header">
            <div class="gmap-info-title">${pin.caseRef}</div>
            <span class="gmap-badge gmap-badge-case">${pin.status}</span>
          </div>
          <div class="gmap-info-body">
            <div class="gmap-stat-row"><span class="label">Animal:</span><span class="val font-bold">${pin.animal}</span></div>
            <div class="gmap-stat-row"><span class="label">Disease:</span><span class="val text-danger font-bold">${pin.disease || 'Suspected'}</span></div>
            <div class="gmap-stat-row"><span class="label">Location:</span><span class="val">${pin.village || '—'}, ${pin.district}</span></div>
            <div class="gmap-stat-row"><span class="label">GPS:</span><span class="val font-mono">${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</span></div>
            <div class="gmap-stat-row"><span class="label">Vet:</span><span class="val">${pin.vet || '—'}</span></div>
          </div>
        </div>
      `;

      caseMarker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(caseInfo);
          infoWindowRef.current.open(map, caseMarker);
        }
      });

      markersRef.current.push(caseMarker);
    });
  }, [districts, casePins, selected, mode, showBufferZones, showConnections, loadStatus, onSelect]);

  useEffect(() => {
    renderMapLayers();
  }, [renderMapLayers]);

  // ── Helper: compute LatLngBounds from any GeoJSON geometry ─────────────────
  function boundsFromGeometry(geometry) {
    if (!window.google?.maps) return null;
    const bounds = new window.google.maps.LatLngBounds();
    function walk(coords) {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === 'number') {
        bounds.extend({ lat: coords[1], lng: coords[0] });
      } else {
        coords.forEach(walk);
      }
    }
    walk(geometry.coordinates);
    return bounds;
  }

  // ── District boundary polygon overlay ──────────────────────────────────────
  const GEOJSON_URL =
    'https://raw.githubusercontent.com/datameet/maps/master/Districts/maharashtra.geojson';

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps || loadStatus !== 'ready') return;

    // Clear any existing boundary features
    districtLayerFeaturesRef.current.forEach((f) => map.data.remove(f));
    districtLayerFeaturesRef.current = [];

    if (!selected) return; // nothing selected → just clear

    const rawDist = typeof selected === 'string' ? selected : (selected.district || selected.name || '');
    const canonicalSelected = normalizeDistrictName(rawDist).toLowerCase();

    let explicitLat = typeof selected === 'object' && selected ? (selected.lat ?? selected.latitude) : null;
    let explicitLng = typeof selected === 'object' && selected ? (selected.lng ?? selected.longitude) : null;

    if (explicitLat !== null && explicitLng !== null && !isNaN(Number(explicitLat)) && !isNaN(Number(explicitLng))) {
      map.panTo({ lat: Number(explicitLat), lng: Number(explicitLng) });
      map.setZoom(typeof selected === 'object' && selected?.zoom ? selected.zoom : 12);
    }

    function applyBoundary(geojson) {
      // Find the matching feature by common property keys
      const feature = geojson.features.find((f) => {
        const p = f.properties || {};
        const raw = p.DISTRICT || p.district || p.NAME_2 || p.NAME || p.name || '';
        return normalizeDistrictName(raw).toLowerCase() === canonicalSelected;
      });

      if (!feature) {
        if (explicitLat === null || explicitLng === null) {
          const canonical = normalizeDistrictName(rawDist);
          const coord = DISTRICT_COORDINATES[rawDist] || DISTRICT_COORDINATES[canonical];
          if (coord) { map.panTo(coord); map.setZoom(10); }
        }
        return;
      }

      // Render boundary via Data layer
      const added = map.data.addGeoJson({
        type: 'FeatureCollection',
        features: [feature],
      });
      districtLayerFeaturesRef.current = added;

      // Style: teal semi-transparent fill with bright stroke
      map.data.setStyle({
        fillColor: '#10b981',
        fillOpacity: 0.18,
        strokeColor: '#059669',
        strokeWeight: 2.5,
        strokeOpacity: 0.95,
        zIndex: 5,
      });

      // Fit map viewport to district boundary if no explicit GPS zoom was requested
      if (explicitLat === null || explicitLng === null) {
        const bounds = boundsFromGeometry(feature.geometry);
        if (bounds && !bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 60, right: 20, bottom: 20, left: 20 });
        }
      }
    }

    if (geoJsonCacheRef.current) {
      applyBoundary(geoJsonCacheRef.current);
    } else {
      fetch(GEOJSON_URL)
        .then((r) => r.json())
        .then((data) => {
          geoJsonCacheRef.current = data;
          applyBoundary(data);
        })
        .catch((err) => {
          console.warn('[Boundary] GeoJSON fetch failed, falling back to centroid pan:', err);
          const canonical = normalizeDistrictName(selected);
          const coord = DISTRICT_COORDINATES[selected] || DISTRICT_COORDINATES[canonical];
          if (coord) { map.panTo(coord); map.setZoom(10); }
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, loadStatus]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      // Clear boundary overlay
      districtLayerFeaturesRef.current.forEach((f) => mapInstanceRef.current.data.remove(f));
      districtLayerFeaturesRef.current = [];
      mapInstanceRef.current.panTo(MAHARASHTRA_CENTER);
      mapInstanceRef.current.setZoom(MAHARASHTRA_DEFAULT_ZOOM);
    }
  };


  return (
    <div className="gmap-wrapper" style={{ height: `${height}px` }}>
      {/* MAP CONTROLS OVERLAY */}
      {showControls && loadStatus === 'ready' && (
        <div className="gmap-floating-controls">
          <div className="gmap-btn-group">
            <button
              type="button"
              className={`gmap-btn ${mapType === 'hybrid' ? 'active' : ''}`}
              onClick={() => setMapType('hybrid')}
              title="Google Earth / Satellite imagery with district labels"
            >
              <Globe size={14} />
              <span>Satellite / Earth</span>
            </button>
            <button
              type="button"
              className={`gmap-btn ${mapType === 'roadmap' ? 'active' : ''}`}
              onClick={() => setMapType('roadmap')}
              title="Clean Vector Roadmap view"
            >
              <Layers size={14} />
              <span>Map</span>
            </button>
            <button
              type="button"
              className={`gmap-btn ${mapType === 'terrain' ? 'active' : ''}`}
              onClick={() => setMapType('terrain')}
              title="Terrain & Topography"
            >
              <Compass size={14} />
              <span>Terrain</span>
            </button>
          </div>

          <div className="gmap-btn-group">
            <button
              type="button"
              className={`gmap-btn ${is3D ? 'active' : ''}`}
              onClick={() => setIs3D(!is3D)}
              title="Toggle 3D Earth perspective angle"
            >
              <Activity size={14} />
              <span>3D Angle {is3D ? 'ON' : 'OFF'}</span>
            </button>
            <button
              type="button"
              className={`gmap-btn ${showBufferZones ? 'active' : ''}`}
              onClick={() => setShowBufferZones(!showBufferZones)}
              title="Toggle Outbreak Containment Buffer Rings"
            >
              <Radio size={14} />
              <span>Containment Rings</span>
            </button>
            <button
              type="button"
              className="gmap-btn"
              onClick={resetView}
              title="Reset view to Maharashtra Center"
            >
              <Maximize2 size={14} />
              <span>Center</span>
            </button>
          </div>
        </div>
      )}

      {/* MAP CANVAS */}
      <div ref={mapContainerRef} className="gmap-canvas" style={{ width: '100%', height: '100%' }} />

      {/* LOADING STATE */}
      {loadStatus === 'loading' && (
        <div className="gmap-overlay-banner" style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
          <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshCw size={20} className="spin-animate" />
            <span>Loading Google Earth Satellite telemetry...</span>
          </div>
        </div>
      )}

      {/* API KEY CONFIGURATION MODAL / BANNER (IF KEY MISSING OR ERROR) */}
      {(loadStatus === 'no-key' || loadStatus === 'error') && (
        <div className="gmap-overlay-banner">
          <div className="gmap-key-card">
            <div className="gmap-card-header">
              <div className="icon-wrap">
                <Globe size={24} className="text-primary" />
              </div>
              <div>
                <h3>Google Earth &amp; Maps Live Integration</h3>
                <p>
                  Connect your Google Maps JavaScript API Key to view high-resolution satellite imagery, 3D
                  terrain, and real-time livestock disease telemetry.
                </p>
              </div>
            </div>

            {loadStatus === 'error' && (
              <div className="gmap-error-alert">
                <AlertTriangle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveKey} className="gmap-key-form">
              <label htmlFor="gmap-key-input">Enter Google Maps API Key:</label>
              <div className="gmap-input-group">
                <input
                  id="gmap-key-input"
                  type="text"
                  placeholder="AIzaSy..."
                  value={tempKeyInput}
                  onChange={(e) => setTempKeyInput(e.target.value)}
                />
                <button type="submit" className="gmap-submit-btn">
                  Connect Map
                </button>
              </div>
              <div className="gmap-tip">
                Tip: You can also set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file.
              </div>
            </form>


          </div>
        </div>
      )}

      {/* LIVE FOOTER STATUS */}
      {loadStatus === 'ready' && (
        <div className="gmap-status-pill">
          <span className="live-dot" /> Google Earth Live Stream · Maharashtra Region
        </div>
      )}
    </div>
  );
}
