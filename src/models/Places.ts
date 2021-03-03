import { assign } from "lodash";
import { v4 } from "uuid";

export class Place {
  public readonly id = v4();
  public country: string;
  public address: string;
  public flagEmoji: string;
  public coords: Coordinates;

  constructor(data: Partial<Place>) {
    assign(this, data);
  }
}
