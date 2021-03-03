<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { reject, concat, find } from "lodash";
import Places from "./Places.vue";
import Map from "./Map.vue";
import { Place } from "../models";
import { useLocalStorage } from "../hooks";

export default defineComponent({
  name: "App",
  components: { Places, Map },
  setup() {
    const places = useLocalStorage<Place[]>("places", []);
    const selectedPlace = ref<Maybe<Place>>();
    let prevSelectedPlace: Maybe<Place>;

    const addPlace = (data: Omit<Place, "id">): void => {
      places.value = concat<Place>(places.value, new Place(data));
    };

    const removePlace = (placeId: string): void => {
      places.value = reject<Place>(places.value, { id: placeId });
    };

    const selectPlace = (placeId: Maybe<string>): void => {
      if (placeId) {
        prevSelectedPlace = selectedPlace.value;
        selectedPlace.value = find(places.value, { id: placeId });
      } else selectedPlace.value = null;
    };

    const mapCenter = computed<Coordinates>(() => {
      if (prevSelectedPlace && prevSelectedPlace === selectedPlace.value) {
        const { lng, lat } = selectedPlace.value?.coords;
        const veryLittleShift = 0.001;

        return { lng, lat: lat - veryLittleShift };
      }

      return (
        selectedPlace.value?.coords ||
        places.value[0]?.coords || { lng: 0, lat: 0 }
      );
    });

    return {
      places,
      addPlace,
      removePlace,
      selectPlace,
      selectedPlace,
      mapCenter
    };
  }
});
</script>
<template>
  <div class="d-flex" style="max-height: 100vh">
    <Map
      @selectPlace="selectPlace"
      @addPlace="addPlace"
      @removePlace="removePlace"
      :mapCenter="mapCenter"
      :selectedPlaceId="selectedPlace?.id"
      :places="places"
    />
    <Places
      @selectPlace="selectPlace"
      @removePlace="removePlace"
      :selectedPlaceId="selectedPlace?.id"
      :places="places"
    />
  </div>
</template>
