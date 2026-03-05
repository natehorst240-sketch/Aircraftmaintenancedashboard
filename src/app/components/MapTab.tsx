import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Plane,
  Radio,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  WifiOff,
  Wifi,
} from "lucide-react";
import { aircraftData, Aircraft } from "../data/mockData";
import { fetchFleetLiveData, ProcessedAircraftData } from "../services/adsbService";

export default function MapTab() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [aircraftPositions, setAircraftPositions] = useState(aircraftData);
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">("satellite");
  const [autoFollow, setAutoFollow] = useState(false);
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(false);
  const [liveDataStatus, setLiveDataStatus] = useState<{
    connected: boolean;
    lastUpdate: Date | null;
    liveCount: number;
  }>({
    connected: false,
    lastUpdate: null,
    liveCount: 0,
  });
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map - centered on Salt Lake City, Utah
    const map = L.map(mapContainerRef.current, {
      center: [40.7608, -111.8910], // Salt Lake City
      zoom: 7, // Zoom out to see more of Utah
      zoomControl: true,
    });

    // Add initial tile layer
    const tileLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18,
      }
    );
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update tile layer when map style changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const map = mapRef.current;
    const oldTileLayer = tileLayerRef.current;

    // Remove old tile layer
    map.removeLayer(oldTileLayer);

    // Add new tile layer
    const tileLayerUrl = mapStyle === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const tileLayerAttribution = mapStyle === "satellite"
      ? 'Tiles &copy; Esri'
      : '&copy; OpenStreetMap contributors';

    const newTileLayer = L.tileLayer(tileLayerUrl, {
      attribution: tileLayerAttribution,
      maxZoom: 18,
    });
    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Fetch live ADS-B data
  const fetchLiveData = async () => {
    setIsLoadingLiveData(true);
    try {
      const liveData = await fetchFleetLiveData();
      
      if (liveData.length > 0) {
        // Update aircraft positions with live data
        setAircraftPositions((prev) =>
          prev.map((aircraft) => {
            const liveAircraft = liveData.find(
              (live) => live.callsign.includes(aircraft.registration)
            );

            if (liveAircraft) {
              return {
                ...aircraft,
                location: {
                  latitude: liveAircraft.latitude,
                  longitude: liveAircraft.longitude,
                  altitude: liveAircraft.altitude,
                  heading: liveAircraft.heading,
                  speed: liveAircraft.speed,
                  lastUpdate: liveAircraft.lastUpdate,
                },
                status: liveAircraft.onGround ? "on-ground" : "in-flight",
                isLive: true,
              };
            }
            return { ...aircraft, isLive: false };
          })
        );

        setLiveDataStatus({
          connected: true,
          lastUpdate: new Date(),
          liveCount: liveData.length,
        });
      } else {
        setLiveDataStatus({
          connected: false,
          lastUpdate: new Date(),
          liveCount: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch live ADS-B data:", error);
      setLiveDataStatus({
        connected: false,
        lastUpdate: new Date(),
        liveCount: 0,
      });
    } finally {
      setIsLoadingLiveData(false);
    }
  };

  // Auto-refresh live data every 30 seconds
  useEffect(() => {
    // Initial fetch
    fetchLiveData();

    // Set up interval (30 seconds to respect API rate limits)
    const interval = setInterval(() => {
      fetchLiveData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers
    aircraftPositions.forEach((aircraft) => {
      if (!aircraft.location) return;

      const isLive = aircraft.isLive || false;
      const color = aircraft.status === "in-flight"
        ? "#22c55e"
        : aircraft.status === "on-ground"
        ? "#3b82f6"
        : "#f59e0b";

      const icon = L.divIcon({
        html: `
          <div style="transform: rotate(${aircraft.location.heading}deg); display: flex; flex-direction: column; align-items: center;">
            <div style="width: 44px; height: 44px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
              </svg>
              ${isLive ? '<div style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background: #10b981; border-radius: 50%; border: 2px solid white; animation: pulse 2s infinite;"></div>' : ''}
            </div>
            <div style="background: white; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-top: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap; border: 2px solid ${color};">
              ${aircraft.registration}
            </div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.2); }
            }
          </style>
        `,
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([aircraft.location.latitude, aircraft.location.longitude], {
        icon,
      });

      const statusBadge = aircraft.hoursUntil200Hr <= 50
        ? '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Critical</span>'
        : aircraft.hoursUntil200Hr <= 100
        ? '<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Warning</span>'
        : '<span style="border: 1px solid #e2e8f0; color: #64748b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Good</span>';

      const liveIndicator = isLive
        ? '<div style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: #10b981; color: white; border-radius: 6px; margin-bottom: 8px;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 2s infinite;"></div><span style="font-weight: 600; font-size: 12px;">LIVE ADS-B</span></div>'
        : '<div style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: #94a3b8; color: white; border-radius: 6px; margin-bottom: 8px;"><span style="font-weight: 600; font-size: 12px;">SIMULATED</span></div>';

      const popupContent = `
        <div style="padding: 8px; min-width: 260px;">
          ${liveIndicator}
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h3 style="font-size: 18px; font-weight: 600; margin: 0;">${aircraft.registration}</h3>
            ${statusBadge}
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #64748b;">Status:</span>
              <span style="font-weight: 500; text-transform: capitalize;">${aircraft.status}</span>
            </div>
            ${aircraft.location.speed > 0 ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #64748b;">Speed:</span>
                <span style="font-weight: 500;">${aircraft.location.speed} knots</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #64748b;">Altitude:</span>
                <span style="font-weight: 500;">${aircraft.location.altitude.toLocaleString()} ft</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #64748b;">Heading:</span>
                <span style="font-weight: 500;">${aircraft.location.heading}°</span>
              </div>
            ` : ''}
            <div style="padding-top: 8px; border-top: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="color: #64748b;">Hours to 200hr:</span>
                <span style="font-weight: 500; color: ${aircraft.hoursUntil200Hr <= 50 ? '#dc2626' : aircraft.hoursUntil200Hr <= 100 ? '#d97706' : '#16a34a'};">
                  ${aircraft.hoursUntil200Hr} hrs
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #64748b;">Total Time:</span>
                <span style="font-weight: 500;">${aircraft.totalTime.toLocaleString()} hrs</span>
              </div>
            </div>
            <div style="padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              Last updated: ${new Date(aircraft.location.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => setSelectedAircraft(aircraft));
      marker.addTo(map);
      markersRef.current[aircraft.id] = marker;
    });
  }, [aircraftPositions]);

  // Auto-follow selected aircraft
  useEffect(() => {
    if (!mapRef.current || !autoFollow || !selectedAircraft?.location) return;

    const aircraft = aircraftPositions.find((a) => a.id === selectedAircraft.id);
    if (aircraft?.location) {
      mapRef.current.setView([aircraft.location.latitude, aircraft.location.longitude], mapRef.current.getZoom());
    }
  }, [aircraftPositions, selectedAircraft, autoFollow]);

  const getAircraftIcon = (status: Aircraft["status"], isLive?: boolean) => {
    const baseIcon = status === "in-flight" ? "✈️" : status === "on-ground" ? "🛬" : "🔧";
    return isLive ? `${baseIcon} 🟢` : baseIcon;
  };

  const getStatusColor = (status: Aircraft["status"]) => {
    switch (status) {
      case "in-flight":
        return "bg-green-500";
      case "on-ground":
        return "bg-blue-500";
      case "maintenance":
        return "bg-amber-500";
      default:
        return "bg-slate-500";
    }
  };

  const getStatusBadge = (aircraft: Aircraft) => {
    if (aircraft.hoursUntil200Hr <= 50) {
      return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    }
    if (aircraft.hoursUntil200Hr <= 100) {
      return <Badge className="bg-amber-500 text-xs">Warning</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Good</Badge>;
  };

  const centerOnAircraft = (aircraft: Aircraft) => {
    if (aircraft.location && mapRef.current) {
      mapRef.current.setView([aircraft.location.latitude, aircraft.location.longitude], 12);
      setSelectedAircraft(aircraft);
      markersRef.current[aircraft.id]?.openPopup();
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Sidebar */}
      <div className="w-80 space-y-4 overflow-y-auto">
        {/* Live Data Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {liveDataStatus.connected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-600">Live ADS-B</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-400">Simulated</span>
                  </>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchLiveData}
                disabled={isLoadingLiveData}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingLiveData ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Live Aircraft:</span>
                <span className="font-semibold">{liveDataStatus.liveCount} / {aircraftData.length}</span>
              </div>
              {liveDataStatus.lastUpdate && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Last Update:</span>
                  <span className="text-xs text-slate-500">
                    {liveDataStatus.lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Radio className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-900 mb-1">OpenSky Network</div>
                  Live data from free ADS-B network. Updates every 30 seconds.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Controls */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Map Style</Label>
              <div className="flex gap-2">
                <Button
                  variant={mapStyle === "satellite" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMapStyle("satellite")}
                  className="flex-1"
                >
                  Satellite
                </Button>
                <Button
                  variant={mapStyle === "streets" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMapStyle("streets")}
                  className="flex-1"
                >
                  Streets
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-follow" className="text-sm font-medium">
                Auto-Follow
              </Label>
              <Switch
                id="auto-follow"
                checked={autoFollow}
                onCheckedChange={setAutoFollow}
                disabled={!selectedAircraft}
              />
            </div>
          </CardContent>
        </Card>

        {/* Aircraft List */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Fleet Status</h3>
            <div className="space-y-2">
              {aircraftPositions.map((aircraft) => (
                <button
                  key={aircraft.id}
                  onClick={() => centerOnAircraft(aircraft)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedAircraft?.id === aircraft.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getAircraftIcon(aircraft.status, aircraft.isLive)}</span>
                      <span className="font-semibold text-slate-900">
                        {aircraft.registration}
                      </span>
                      {aircraft.isLive && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    {getStatusBadge(aircraft)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(aircraft.status)}`} />
                    <span className="capitalize">{aircraft.status}</span>
                    {aircraft.isLive && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        LIVE
                      </Badge>
                    )}
                  </div>

                  {aircraft.location && aircraft.status === "in-flight" && (
                    <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">Speed</div>
                        <div className="font-medium">{aircraft.location.speed} kts</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Altitude</div>
                        <div className="font-medium">
                          {aircraft.location.altitude.toLocaleString()} ft
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-sm">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>In Flight</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>On Ground</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Maintenance</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Live ADS-B Data</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-slate-400" />
                <span>Simulated Position</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="flex-1">
        <CardContent className="p-0 h-full">
          <div ref={mapContainerRef} className="h-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
