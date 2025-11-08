"use client";

import React, { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";

// ---- Fix default icon paths ----
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// ---- Search control component ----
const SearchField = ({ onLocationChange }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
    });

    map.addControl(searchControl);

    map.on("geosearch/showlocation", (result) => {
      const { x, y } = result.location;
      onLocationChange({ lat: y, lng: x });
    });

    return () => {
      if (map && searchControl) map.removeControl(searchControl);
    };
  }, [map, onLocationChange]);

  return null;
};

// ---- Main Map Picker ----
const MapPicker = ({ onLocationChange, initialPosition }) => {
  const [position, setPosition] = useState(
    initialPosition || [19.7515, 75.7139] // Default: Maharashtra, India
  );

  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
  }, [initialPosition]);

  const DraggableMarker = () => {
    const map = useMap();
    const eventHandlers = useMemo(
      () => ({
        dragend(e) {
          const marker = e.target;
          const newPos = marker.getLatLng();
          setPosition([newPos.lat, newPos.lng]);
          onLocationChange({ lat: newPos.lat, lng: newPos.lng });
        },
      }),
      [onLocationChange]
    );

    useEffect(() => {
      map.flyTo(position, map.getZoom());
    }, [position, map]);

    return (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={position}
      />
    );
  };

  return (
    <div className="rounded-md overflow-hidden">
      <MapContainer
        center={position}
        zoom={5}
        style={{ height: "400px", width: "100%" }}
        className="rounded-2xl z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <DraggableMarker />
        <SearchField onLocationChange={onLocationChange} />
      </MapContainer>
    </div>
  );
};

export default MapPicker;
