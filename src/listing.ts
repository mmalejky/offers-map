import { setMarkerHighlight } from "./markers";
import { Offer } from "./types";

export function setTileHighlight(id: string, set: boolean) {
  const offerTile = document.getElementById("offer-" + id)!;
  if (set) {
    offerTile.classList.add("offer-highlight");
  } else {
    offerTile.classList.remove("offer-highlight");
  }
}

export function newListing(offers: Offer[]): void {
  const offersList = document.getElementById("list")!;
  offersList.textContent = "";
  for (const offer of offers) {
    offersList.appendChild(getOfferTile(offer));
  }
}

function getOfferTile(offer: Offer): HTMLElement {
  const title = document.createElement("h6");
  title.innerHTML = offer["title"];

  const img = document.createElement("img");
  img.className = "offer-img";
  img.src = offer["thumb"];

  const imgDiv = document.createElement("div");
  imgDiv.className = "offer-img-div";
  imgDiv.appendChild(img);

  const price = document.createElement("h6");
  price.className = "offer-price";
  price.innerHTML = offer["displayPrice"];

  const div = document.createElement("div");
  div.id = `offer-${offer["id"]}`;
  div.className = "offer-div";
  div.appendChild(imgDiv);
  div.appendChild(title);
  div.appendChild(price);

  div.addEventListener("mouseover", () => {
    setTileHighlight(offer["id"], true);
    setMarkerHighlight(offer["id"], true);
  });
  div.addEventListener("mouseout", () => {
    setTileHighlight(offer["id"], false);
    setMarkerHighlight(offer["id"], false);
  });

  const a = document.createElement("a");
  a.href = offer["url"];
  a.target = "_blank";
  a.appendChild(div);
  return a;
}
