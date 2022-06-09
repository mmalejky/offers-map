import { Offer, SearchParams } from "./types";
import { isPointInSelection } from "./map";

export default async function getOffers(
  searchParams: SearchParams
): Promise<Array<Offer>> {
  var currentOffers: Array<Offer> = [];
  var pageNumber = 1;
  while (currentOffers.length < searchParams.count) {
    const offersPackage: Array<Offer> | null = await getOffersFromPage(
      pageNumber, searchParams
    );
    if (offersPackage == null) break;
    currentOffers = currentOffers.concat(offersPackage.filter(o => includeOffer(o, searchParams)));
    pageNumber += 1;
  }
  return currentOffers.slice(0, searchParams.count);
}

function includeOffer(offer: Offer, searchParams: SearchParams): boolean {
  if (searchParams.excludingIds.indexOf(offer["id"]) > -1) return false;
  return isPointInSelection(offer["loc"]);
}
function convertOlxOffer(offer: any): Offer {
  var imgUrl = offer["photos"][0];
  imgUrl = typeof imgUrl === "string" ? imgUrl.split(";")[0] : null;
  const priceErr =
    offer["price"] == null || offer["price"]["regularPrice"] == null;
  const newOffer: Offer = {
    id: offer["id"],
    url: offer["url"],
    imgUrl: imgUrl,
    thumb: imgUrl ? imgUrl + ";s=300x0;q=50" : "no-image.png",
    title: offer["title"],
    price: priceErr ? 0.0 : offer["price"]["regularPrice"]["value"],
    displayPrice:
      offer["price"] == null ? "0 zł" : offer["price"]["displayValue"],
    loc: [offer["map"]["lon"], offer["map"]["lat"]],
    vendor: "olx",
  };
  return newOffer;
}
async function getOffersFromPage(page: number, searchParams: SearchParams): Promise<Array<Offer> | null> {
  const url = new URL(
    `https://www.olx.pl/d/oferty/q-${searchParams.phrase}/`
  );
  url.searchParams.append("page", String(page));
  const response = await fetch(url.toString());
  if (response.ok) {
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const olxScriptContent = doc
      .getElementById("olx-init-config")
      ?.textContent?.split("window.__PRERENDERED_STATE__= ")[1]
      .split(";\n")[0];
    if (olxScriptContent == null) {
      return null;
    }
    const offersRaw = JSON.parse(JSON.parse(olxScriptContent))["listing"][
      "listing"
    ]["ads"];
    const result = offersRaw.map(convertOlxOffer);
    return result;
  } else {
    return null;
  }
}

