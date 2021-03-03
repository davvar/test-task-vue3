<template>
  <form v-if="selectedPlace" @submit.prevent="save">
    <div class="mb-3">
      <label for="exampleInputEmail1" class="form-label">Address</label>
      <input
        name="address"
        class="form-control"
        id="exampleInputEmail1"
        v-model="selectedPlace.address"
        aria-describedby="emailHelp"
      />
    </div>
    <div class="mb-3">
      <label for="flag" class="form-label">Flag</label>

      <select v-model="selectedPlace.country" class="form-select" id="flag">
        <option selected
          >{{ selectedPlace.flagEmoji }} {{ selectedPlace.country }}
        </option>
        <option
          name="flag"
          v-for="{ emoji, name } in countriesList"
          :value="name"
          :key="emoji"
          >{{ emoji }} {{ name }}</option
        >
      </select>
    </div>

    <button @click.prevent="$router.go(-1)" class="btn btn-primary m-2">
      Cancel
    </button>
    <button :disabled="disableSaveBtn" type="submit" class="btn btn-primary">
      Save
    </button>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref, computed, reactive } from "vue";
import countryFlagEmoji from "country-flag-emoji";
import { map, find, cloneDeep, every } from "lodash";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useRoute, useRouter } from "vue-router";
import { Place } from "@/models/Places";
import { pick } from "lodash/fp";

interface Country {
  name: string;
  emoji: string;
}

export default defineComponent({
  setup() {
    const router = useRouter();
    const route = useRoute();

    const places = useLocalStorage<Place[]>("places", []);
    const unchangedSelectedPlace = find<Place>(
      places.value,
      ({ id }) => id === route.params.placeId
    );

    if (!unchangedSelectedPlace) {
      router.replace("/");
      return;
    }

    const selectedPlace = reactive<Place>(cloneDeep(unchangedSelectedPlace));
    const countriesList: Country[] = map(
      countryFlagEmoji.list,
      pick<Country, keyof Country>(["name", "emoji"])
    );

    const disableSaveBtn = computed<boolean>(() => {
      const possiblyChangedKeys: Array<keyof Place> = ["country", "address"];

      const nothigChanged = every(
        possiblyChangedKeys,
        key => unchangedSelectedPlace[key] === selectedPlace[key]
      );

      return nothigChanged;
    });

    const save = (): void => {
      if (disableSaveBtn.value) {
        return;
      }

      if (selectedPlace.country !== unchangedSelectedPlace.country) {
        selectedPlace.flagEmoji = find(countryFlagEmoji.list, {
          name: selectedPlace.country
        }).emoji;
      }

      places.value = map(places.value, place =>
        place.id === selectedPlace.id ? selectedPlace : place
      );

      router.replace("/");
    };

    return { countriesList, selectedPlace, disableSaveBtn, save };
  }
});
</script>

<style scoped>
form {
  width: 600px;
  margin: auto;
  transform: translateY(50%);
}
</style>
