import * as L from "leaflet";
import "leaflet.markercluster";

import { setTileHighlight } from "./listing";
import { getBounds } from "./map";
import { getOffer } from "./offers-map";
import { Offer } from "./types";

var markers: L.MarkerClusterGroup; // Markers on map
var markerMouseoverTimeoutId: NodeJS.Timeout; // Timeout of marker

export function getMarkerBounds() {
  return markers.getBounds();
}

function getMarkersInBounds(bounds: L.LatLngBounds): Set<L.Marker> {
  const visibleMarkers: Set<L.Marker> = new Set();
  markers.eachLayer((layer: L.Layer) => {
    const nextVisibleMarker = markers.getVisibleParent(layer as L.Marker);
    if (
      nextVisibleMarker != null &&
      bounds.contains(nextVisibleMarker.getLatLng())
    ) {
      visibleMarkers.add(nextVisibleMarker);
    }
  });
  return visibleMarkers;
}

export function getVisibleOffersIds(): Set<Array<string>> {
  const visibleMarkers = getMarkersInBounds(getBounds());
  const ids: Set<Array<string>> = new Set();
  [...visibleMarkers].map((m) => ids.add(getMarkerIds(m)));
  return ids;
}

export function getDummyDiv(id: string) {
  const div = document.createElement("div");
  div.id = id;
  div.className = "dummy";
  return div;
}

export function setMarkerHighlight(id: string, set: boolean): void {
  const iconImg = document.querySelector(`div.dummy[id*="${id}"]`)!;
  if (set) {
    iconImg.parentElement!.style.background = "#87CEEB";
  } else {
    iconImg.parentElement!.style.background = "white";
  }
}

export function loadMarker(offer: Offer) {
  const img = document.createElement("img");
  img.className = "icon-img";
  img.src = `assets/${offer["vendor"]}.ico`;

  const price = document.createElement("b");
  price.innerHTML = ` ${offer["price"]} zł`;

  const div = getDummyDiv(offer["id"]);
  div.appendChild(img);
  div.appendChild(price);

  const icon = new L.DivIcon({
    className: "my-div-icon",
    html: div.outerHTML,
  });

  const loc = L.latLng([offer["loc"][1], offer["loc"][0]]);
  const marker = L.marker(loc, {
    alt: offer["id"],
    icon: icon,
  });
  offer["markerId"] = L.stamp(marker);
  markers.addLayer(marker);
}

function getClusterIcon(cluster: L.MarkerCluster) {
  const childMarkers = cluster.getAllChildMarkers();
  const locCount = new Set(childMarkers.map((m) => m.getLatLng().toString())).size;
  const ids: Array<string> = getMarkerIds(cluster);
  const minPrice = Math.min(
    ...ids.map((id: string) => (getOffer(id) as Offer)["price"])
  );

  const content = document.createElement("b");
  const locStr = locCount > 1 ? `(${locCount})` : "";
  content.innerHTML = `${childMarkers.length} szt ${locStr} od<br>${minPrice} zł`;

  const div = getDummyDiv(`marker-${ids.join("-")}`);
  div.appendChild(content);

  const icon = L.divIcon({
    className: "my-div-icon",
    html: div.outerHTML,
  });
  return icon;
}

export function getMarkerIds(marker: L.Marker): Array<string> {
  if (marker instanceof L.MarkerCluster) {
    return marker
      .getAllChildMarkers()
      .map((marker: L.Marker) => marker.options["alt"] as string);
  } else {
    return [marker.options["alt"] as string];
  }
}

export function clearMarkers() {
  markers.clearLayers();
}

export function createMarkerLayer(): L.MarkerClusterGroup {
  function setHighlightAndScroll(
    e: L.LeafletEvent,
    highlightAndScroll: boolean
  ) {
    const ids = getMarkerIds(e.sourceTarget);
    if (highlightAndScroll) {
      const offerTile = document.getElementById(`offer-${ids[0]}`);
      markerMouseoverTimeoutId = setTimeout(function () {
        offerTile!.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } else {
      clearTimeout(markerMouseoverTimeoutId);
    }
    ids.map((id) => {
      setTileHighlight(id, highlightAndScroll);
      setMarkerHighlight(id, highlightAndScroll);
    });
  }

  markers = L.markerClusterGroup({
    maxClusterRadius: 60,
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false,
    iconCreateFunction: getClusterIcon,
  });

  markers
    .on("mouseover", (e) => setHighlightAndScroll(e, true))
    .on("mouseout", (e) => setHighlightAndScroll(e, false))
    .on("clustermouseover", (e) => setHighlightAndScroll(e, true))
    .on("clustermouseout", (e) => setHighlightAndScroll(e, false));

  return markers;
}
