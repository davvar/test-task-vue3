import { assign } from "lodash";
import { v4 } from "uuid";

export interface Coordinates {
  lng: number;
  lat: number;
}

export class Place {
  public readonly id = v4();
  public readonly createdAt = new Date().toJSON().slice(0, 10);
  public country: string;
  public address: string;
  public flagEmoji: string;
  public coords: Coordinates;

  constructor(data: Partial<Place>) {
    assign(this, data);
  }
}
