import { createApp } from "vue";
import App from "./App.vue";
import EditPlace from "./components/EditPlace.vue";
import Home from "./components/Home.vue";
import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: "/", component: Home },
  { path: "/edit/:placeId", component: EditPlace }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

createApp(App)
  .use(router)
  .mount("#app");
