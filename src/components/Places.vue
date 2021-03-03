<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { Place } from "@/models/Places";
import { isString } from "lodash";
import { required } from "../constants";

interface Props {
  places: Place[];
}

export default defineComponent({
  name: "Places",
  props: {
    places: {
      type: Array as PropType<Place[]>,
      default: (): Place[] => [],
      required
    },
    selectedPlaceId: String
  },
  emits: {
    removePlace: (id: string) => id && isString(id),
    selectPlace: (id: string) => id && isString(id)
  },
  setup() {
    const shouldShowFlags = ref<boolean>(true);

    return { shouldShowFlags };
  }
});
</script>
<template>
  <table
    style="max-height: 100vh; overflow: scroll"
    class="table table-bordered "
  >
    <thead>
      <tr>
        <th scope="col">
          <div class="form-check">
            <label class="form-check-label" for="checkbox">
              Flag
            </label>
            <input
              id="checkbox"
              class="form-check-input"
              type="checkbox"
              v-model="shouldShowFlags"
            />
          </div>
        </th>
        <th scope="col">Country</th>
        <th scope="col">Address</th>
        <th scope="col"></th>
      </tr>
    </thead>
    <tbody v-if="places.length">
      <tr
        v-for="{ id, address, country, flagEmoji } in places"
        :class="{ active: selectedPlaceId === id }"
        :key="id"
        @click="$emit('selectPlace', id)"
      >
        <td class="text-center p-0" style="font-size: 30px">
          {{ shouldShowFlags ? flagEmoji : "" }}
        </td>
        <td>{{ country }}</td>
        <td>
          {{ address.length > 30 ? `${address.slice(0, 30)}...` : address }}
        </td>
        <td>
          <router-link :to="`/edit/${id}`">
            <button class="btn btn-primary me-1">
              edit
            </button>
          </router-link>
          <button @click.stop="$emit('removePlace', id)" class="btn btn-danger">
            remove
          </button>
        </td>
      </tr>
    </tbody>
    <h3 v-if="!places.length" class="text-center">Nothing to show!</h3>
  </table>
</template>

<style scoped>
.active {
  background: rgb(71, 132, 223);
  color: white;
}
</style>
