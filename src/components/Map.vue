<script lang="ts">
import { Loader, google } from "google-maps";
import {
  defineComponent,
  onMounted,
  ref,
  toRefs,
  PropType,
  watch,
  onUnmounted,
  inject
} from "vue";
import env from "../environements";
import { Place } from "@/models/Places";
import { getAddress } from "../api/getAddress";
import { Coordinates } from "../models/Places";
import _ from "lodash";
import { useGeolocation } from "../hooks/useGeolocation";
import Loading from "./Loading.vue";

export type Map = google.maps.Map<HTMLDivElement>;

export interface MarkerInfo {
  marker: google.maps.Marker;
  removeListener: () => void;
}

export interface MarkersMap {
  [placeId: string]: MarkerInfo;
}

export default defineComponent({
  name: "Map",
  components: { Loading },
  emits: ["addPlace", "selectPlace", "removePlace"],
  props: {
    places: {
      type: Array as PropType<Place[]>,
      required: true,
      default: (): Place[] => []
    },
    mapCenter: {
      type: Object as PropType<Coordinates>,
      required: true
    },
    selectedPlaceId: String
  },
  setup(props, { emit }) {
    const { places, mapCenter, selectedPlaceId } = toRefs(props);

    const mapContainer = ref<HTMLDivElement>();
    const map = ref<Map>();
    let googleMaps: typeof google.maps;
    let clickListener: google.maps.MapsEventListener;
    let markers: MarkersMap;

    watch<Place[]>(places, handlePlacesChange);
    watch<Coordinates>(mapCenter, () => {
      handleMarkersFocus();
      map.value?.setCenter(mapCenter.value);
    });

    onMounted(async () => {
      console.log(googleMaps);
      googleMaps = (await new Loader(env.googleMapApiKey).load()).maps;
      map.value = await initMap(googleMaps);
      markers = placeMarkers(props.places);
    });

    onUnmounted(() => clickListener && clickListener.remove());

    async function initMap(googleMaps: google["maps"]): Promise<Map> {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const map = new googleMaps.Map(mapContainer.value!, {
        center: await useGeolocation(),
        zoom: 8
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
          ...(await getAddress(e.latLng.toUrlValue())),
          coords: {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          }
        });
      }
    }

    function handlePlacesChange(newPlaces: Place[], oldPlaces: Place[]): void {
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

          if (
            address !== marker.getTitle() ||
            flagEmoji !== marker.getLabel()?.text
          ) {
            marker.setTitle(address);
            if (flagEmoji) {
              marker.setLabel({ ...marker.getLabel(), text: flagEmoji });
            }
            break;
          }
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
      if (mapCenter.value) {
        _.each(markers, ({ marker }, placeId) => {
          if (selectedPlaceId?.value === placeId) {
            marker.setAnimation(googleMaps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 3000);
          } else marker.setAnimation(null);
        });
      } else _.each(markers, ({ marker }) => marker.setAnimation(null));
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
