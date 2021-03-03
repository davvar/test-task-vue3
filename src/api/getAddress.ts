import axios from "axios";
import { find, get } from "lodash";
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

export const getAddress = async (
  latlng: string
): Promise<{ address: string; flagEmoji?: string }> => {
  try {
    const { results } = await axios
      .get<Response>(getUrl(latlng))
      .then(res => res.data);

    let res: any = {
      address: get(results, "[0].formatted_address", "unknown address")
    };

    const countryInfo = getCountryInfo(results);
    if (countryInfo) {
      res = { ...res, ...countryInfo };
    }

    return res;
  } catch (error) {
    console.log(error.message);
    return {
      address: "unknown address"
    };
  }
};

function getCountryInfo(
  results: Response["results"]
): { flagEmoji: string; country: string } | void {
  const res = find(results[0].address_components, ({ types }) =>
    types.includes("country")
  );

  if (res) {
    const { emoji, name } = countryFlagEmoji.get(res.short_name);
    return {
      flagEmoji: emoji,
      country: name
    };
  }
}
