<script lang="ts">
import { Loader, google } from "google-maps";
import {
  defineComponent,
  onMounted,
  ref,
  toRefs,
  PropType,
  watch,
  onUnmounted
} from "vue";
import _, { isNumber, isString } from "lodash";
import env from "../environements";
import Loading from "./common/Loading.vue";
import { Place } from "@/models";
import { getAddress } from "../helpers";
import { useGeolocation } from "../hooks";
import { required } from "../constants";

export interface MarkerInfo {
  marker: google.maps.Marker;
  removeListener: () => void;
}

export interface MarkersMap {
  [placeId: string]: MarkerInfo;
}

let googleMaps: typeof google.maps;
export default defineComponent({
  name: "Map",
  components: { Loading },
  emits: {
    removePlace: (id: string) => isString(id),
    selectPlace: (id: string) => isString(id),
    addPlace: ({
      address,
      coords: { lng, lat },
      country,
      flagEmoji
    }: Pick<Place, "address" | "coords"> &
      Pick<Partial<Place>, "country" | "flagEmoji">) => {
      if (
        (country && !isString(country)) ||
        (flagEmoji && !isString(flagEmoji))
      ) {
        return false;
      }

      return [address].every(isString) && [lat, lng].every(isNumber);
    }
  },
  props: {
    places: {
      type: Array as PropType<Place[]>,
      default: (): Place[] => [],
      required
    },
    mapCenter: {
      type: Object as PropType<Coordinates>,
      required
    },
    selectedPlaceId: String
  },
  setup(props, { emit }) {
    const { places, mapCenter, selectedPlaceId } = toRefs(props);

    const mapContainer = ref<HTMLDivElement>();
    const map = ref<google.maps.Map<HTMLDivElement>>();
    let clickListener: google.maps.MapsEventListener;
    let markers: MarkersMap;

    watch<Place[]>(places, handlePlacesCRUD);
    watch<Coordinates>(mapCenter, () => {
      handleMarkersFocus();
      map.value?.setCenter(mapCenter.value);
    });

    onMounted(async () => {
      if (!googleMaps) {
        googleMaps = (await new Loader(env.googleMapApiKey).load()).maps;
      }
      map.value = await initMap(googleMaps);
      markers = placeMarkers(props.places);
    });

    onUnmounted(() => clickListener && clickListener.remove());

    async function initMap(
      googleMaps: google["maps"]
    ): Promise<google.maps.Map<HTMLDivElement>> {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const map = new googleMaps.Map(mapContainer.value!, {
        center: await useGeolocation(),
        zoom: 6
      });

      clickListener = map.addListener("click", emitAddPlace);
      return map;
    }

    function placeMarkers(places: Place[]): MarkersMap {
      return places?.reduce<MarkersMap>(
        (markersMap, place) => ({ ...markersMap, ...createMarker(place) }),
        {}
      );
    }

    function createMarker(place: Place): { [placeId: string]: MarkerInfo } {
      const { coords, address, id, flagEmoji } = place;

      const marker = new googleMaps.Marker({
        position: coords,
        title: address,
        map: map.value,
        label: { text: flagEmoji, fontSize: "20px" },
        animation: googleMaps.Animation.DROP
      });

      let clickTimeoutId: number;
      const clickListener = marker.addListener("click", () => {
        clickTimeoutId = setTimeout(() => {
          map.value?.setCenter(coords);
          emit("selectPlace", id);
        }, 200);
      });

      const dblClickListener = marker.addListener("dblclick", () => {
        clearTimeout(clickTimeoutId);
        emit("removePlace", id);
      });

      return {
        [id]: {
          marker,
          removeListener: () => {
            clickListener.remove();
            dblClickListener.remove();
          }
        }
      };
    }

    async function emitAddPlace(e: google.maps.MapMouseEvent): Promise<void> {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const metaKey: keyof MouseEvent = isMac ? "metaKey" : "ctrlKey";

      if ((e.domEvent as MouseEvent)[metaKey]) {
        emit("addPlace", {
          coords: {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          },
          ...(await getAddress(e.latLng.toUrlValue()))
        });
      }
    }

    function handlePlacesCRUD(newPlaces: Place[], oldPlaces: Place[]): void {
      const added = newPlaces.length > oldPlaces.length;
      const updated = newPlaces.length === oldPlaces.length;

      if (added) {
        const addedPlace = _.last(newPlaces) as Place;
        markers = {
          ...markers,
          ...createMarker(addedPlace)
        };
      } else if (updated) {
        for (const { id, address, flagEmoji } of newPlaces) {
          const { marker } = markers[id];
          let shouldBreak = false;

          if (address !== marker.getTitle()) {
            marker.setTitle(address);
            shouldBreak = true;
          }

          if (flagEmoji && flagEmoji !== marker.getLabel()?.text) {
            marker.setLabel({ ...marker.getLabel(), text: flagEmoji });
            shouldBreak = true;
          }

          if (shouldBreak) break;
        }
      } else {
        const [removedPlaceId] = _.without(
          _.map(oldPlaces, "id"),
          ..._.map(newPlaces, "id")
        );

        markers[removedPlaceId].marker.setMap(null);
        markers[removedPlaceId].removeListener();
        delete markers[removedPlaceId];
      }

      _.each(markers, ({ marker }) => marker.setAnimation(null));
    }

    function handleMarkersFocus() {
      if (!mapCenter.value) {
        _.each(markers, ({ marker }) => marker.setAnimation(null));
        return;
      }

      _.each(markers, ({ marker }, placeId) => {
        if (selectedPlaceId?.value === placeId) {
          marker.setAnimation(googleMaps.Animation.BOUNCE);
          setTimeout(() => marker.setAnimation(null), 3000);
        } else marker.setAnimation(null);
      });
    }

    return {
      mapContainer,
      map
    };
  }
});
</script>
<template>
  <Loading v-if="!map" class="fullscreen" />
  <div v-show="map" class="fullscreen" ref="mapContainer"></div>
</template>

<style scoped>
.fullscreen {
  width: 100vw;
  height: 100vh;
}
</style>
