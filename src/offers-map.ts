import "./style.css";

import { Offer, SearchParams } from "./types";
import getOlxOffers from "./olx";
import { fitToMarkers, getAreaSelection, isPointInSelection, loadMap } from "./map";
import { clearMarkers, getVisibleOffersIds, loadMarker } from "./markers";
import { newListing } from "./listing";


var phrase: string; // Search phrase
var loadedOffers: Map<string, Offer> = new Map();

document.getElementById("form1")?.addEventListener("keyup", onPhraseClick);
document
  .getElementById("searchButton")
  ?.addEventListener("click", searchButtonClick);

loadMap();
setDarkMode(false);

export function updateMarkersOnSelection() {
  for (const [id, offer] of loadedOffers.entries()) {
    if (!isPointInSelection(offer.loc)) {
      loadedOffers.delete(id);
    }
  }
  clearMarkers();
  loadedOffers.forEach((o) => loadMarker(o));
  updateList();
}

export function updateList() {
  const idSets = getVisibleOffersIds();
  const visibleOffers: Offer[] = [];
  for (const idSet of idSets) {
    idSet.map((id) => {
      visibleOffers.push(loadedOffers.get(id)!);
    });
  }
  newListing(visibleOffers);
}

export function getOffer(id: string): Offer {
  return loadedOffers.get(id)!;
}


function onPhraseClick(event: KeyboardEvent) {
  if (event.key == "Enter") {
    searchButtonClick();
  } else if (event.key == "Escape") {
    (document.getElementById("form1") as HTMLInputElement).value = "";
  }
  refreshButtonIcon();
}

function refreshButtonIcon() {
  const typedPhrase = (document.getElementById("form1") as HTMLInputElement)
    .value;
  if (typedPhrase == phrase) {
    document.getElementById("faplus")?.classList.remove("hidden");
  } else {
    document.getElementById("faplus")?.classList.add("hidden");
  }
}

function searchButtonClick() {
  const INITIAL_OFFERS_COUNT = 10;
  const NEXT_OFFERS_COUNT = INITIAL_OFFERS_COUNT;
  const newPhrase = (document.getElementById("form1") as HTMLInputElement)
    .value;
  if (newPhrase != phrase) {
    clearMarkers();
    loadedOffers = new Map();
    phrase = newPhrase;
    loadOffersOnMap(INITIAL_OFFERS_COUNT);
  } else {
    loadOffersOnMap(NEXT_OFFERS_COUNT);
  }
  refreshButtonIcon();
}

function toggleLoading(): void {
  document.getElementById("page")?.classList.toggle("hidden");
  document.getElementById("loader")?.classList.toggle("hidden");
}

async function loadOffersOnMap(amount: number) {
  toggleLoading();
  const searchParams: SearchParams = {
    phrase: phrase,
    count: amount,
    excludingIds: [...loadedOffers.keys()],
    bounds: getAreaSelection()
  };
  const newOffers: Array<Offer> = await getOlxOffers(searchParams);
  if (newOffers.length == 0) {
    toggleLoading();
    alert("Brak ofert");
    return;
  }
  loadedOffers = new Map([
    ...new Map(newOffers.map((o) => [o["id"], o])),
    ...loadedOffers,
  ]);
  newOffers.map(loadMarker);
  updateList();
  fitToMarkers();
  toggleLoading();
}

export function setDarkMode(set: boolean): void {
  const tiles: HTMLElement = document.getElementsByClassName("map-tiles")[0] as HTMLElement;
  const list = document.getElementById("list")!;
  if (set) {
    document.body.classList.add("dark");
    list.classList.add("dark");
    tiles.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
    list.classList.remove("dark");
    tiles.classList.remove("dark");
  }
}
