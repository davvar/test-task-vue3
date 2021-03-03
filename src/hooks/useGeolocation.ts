import { Coordinates } from "@/models/Places";

export const useGeolocation = async (): Promise<Coordinates> => {
  const {
    coords: { latitude, longitude }
  } = await new Promise<any>((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej)
  ).catch(() => ({
    coords: {
      latitude: 0,
      longitude: 0
    }
  }));

  return { lat: latitude, lng: longitude };
};
