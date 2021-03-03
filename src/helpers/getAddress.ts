/* eslint-disable @typescript-eslint/camelcase */
import axios from "axios";
import { find } from "lodash";
import countryFlagEmoji from "country-flag-emoji";

import env from "../environements";

const getUrl = (latlng: string) =>
  `https://maps.googleapis.com/maps/api/geocode/json?language=en&latlng=${latlng}&key=${env.googleGeocodingApiKey}`;

interface AddressComponents {
  long_name: string;
  short_name: string;
  types: string[];
}

interface Response {
  [key: string]: unknown;
  results: {
    address_components: AddressComponents[];
    formatted_address: string;
  }[];
}

type AddressInfo = { address: string; flagEmoji?: string; country?: string };

export const getAddress = async (latlng: string): Promise<AddressInfo> => {
  try {
    const { results } = await axios
      .get<Response>(getUrl(latlng))
      .then(res => res.data);

    const res: AddressInfo = {
      address: results[0].formatted_address
    };

    return { ...res, ...getCountryNameAndFlag(results[0].address_components) };
  } catch (error) {
    console.log(error.message);
    return {
      address: "unknown address"
    };
  }
};

function getCountryNameAndFlag(
  addresses: AddressComponents[]
): Omit<AddressInfo, "address"> {
  const res = find(addresses, ({ types }) => types.includes("country"));

  if (res) {
    const { emoji, name } = countryFlagEmoji.get(res.short_name);
    return {
      flagEmoji: emoji,
      country: name
    };
  }

  return {};
}
