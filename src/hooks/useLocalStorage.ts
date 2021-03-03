import { ref, UnwrapRef, watch } from "vue";

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const storedValue = ref<T>(
    JSON.parse(window.localStorage.getItem(key) as string) || initialValue
  );

  watch(storedValue, setValue);

  function setValue(value: UnwrapRef<T>) {
    try {
      storedValue.value = value;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  }

  return storedValue;
};
