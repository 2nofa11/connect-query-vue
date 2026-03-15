import "./index.css";
import { createApp } from "vue";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import App from "./App.vue";

const queryClient = new QueryClient();
const app = createApp(App);
app.use(VueQueryPlugin, { queryClient });
app.mount("#app");
