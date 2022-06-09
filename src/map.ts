import * as L from "leaflet";
import "leaflet-easybutton";
import "leaflet-draw";

import { setDarkMode, updateList, updateMarkersOnSelection } from "./offers-map";
import { createMarkerLayer, getMarkerBounds } from "./markers";

import { Position, Polygon, FeatureCollection } from "geojson";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

const POLAND_MAP_OPTIONS: L.MapOptions = {
  maxBounds: L.latLngBounds(L.latLng(55.5, 13.5), L.latLng(48.75, 24.5)),
  zoomSnap: 0.5,
  minZoom: 7,
};

var map: L.Map;
var selectionLayers: L.FeatureGroup = new L.FeatureGroup();

export function getAreaSelection() {
  return selectionLayers;
}

export function fitToMarkers() {
  map.fitBounds(getMarkerBounds(), { animate: false });
}

export function getBounds(): L.LatLngBounds {
  return map.getBounds();
}

export function isPointInSelection(point: Position): boolean {
  const bounds = selectionLayers.toGeoJSON() as FeatureCollection<Polygon>;
  if (bounds.features.length == 0) return true;
  for (const feature of bounds.features) {
    if (booleanPointInPolygon(point, feature.geometry)) return true;
  }
  return false;
}

function addDarkModeButton() {
  const button = L.easyButton({
    states: [
      {
        stateName: "dark-mode",
        icon: "fa-lightbulb center-icon",
        title: "Enable light mode",
        onClick: function (btn, map) {
          setDarkMode(false);
          btn.state("light-mode");
        },
      },
      {
        stateName: "light-mode",
        icon: "fa-moon center-icon",
        title: "Enable dark mode",
        onClick: function (btn, map) {
          setDarkMode(true);
          btn.state("dark-mode");
        },
      },
    ],
  })
  button.state("light-mode");
  button.addTo(map);
}

function addDrawControl() {
  const drawControl = new L.Control.Draw({
    draw: {
      polyline: false,
      marker: false,
      circle: false,
      circlemarker: false,
    },
    edit: {
      featureGroup: selectionLayers,
    },
  });
  map.addControl(drawControl);
  map.addLayer(selectionLayers);

  map.on(L.Draw.Event.CREATED, function (e) {
    const noSelectionBefore = selectionLayers.getLayers().length == 0;
    selectionLayers.addLayer(e.layer);
    if (noSelectionBefore) updateMarkersOnSelection();
  });
  map.on(L.Draw.Event.EDITED, updateMarkersOnSelection);
  map.on(L.Draw.Event.DELETED, updateMarkersOnSelection);
}

function initMap(options: L.MapOptions): L.Map {
  const map = L.map("map", {
    zoomSnap: options.zoomSnap,
    minZoom: options.minZoom,
  });
  map.setMaxBounds(options.maxBounds!);
  map.setView(
    (options.maxBounds! as L.LatLngBounds).getCenter(),
    options.minZoom
  );
  return map;
}

export function loadMap() {
  const tileLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      className: "map-tiles",
    }
  );
  const markers = createMarkerLayer();

  map = initMap(POLAND_MAP_OPTIONS);
  map.addLayer(tileLayer);
  map.addLayer(markers);
  map.addEventListener("moveend", updateList);
  addDarkModeButton();
  addDrawControl();
}
