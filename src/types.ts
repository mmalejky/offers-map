import { Position } from "geojson";

export interface Offer {
  id: string;
  url: string;
  imgUrl: string;
  thumb: string;
  title: string;
  price: number;
  displayPrice: string;
  loc: Position;
  vendor: string;
  markerId?: number;
};

export interface SearchParams {
  phrase: string;
  count: number;
  excludingIds: Array<String>;
  bounds: L.FeatureGroup;
};