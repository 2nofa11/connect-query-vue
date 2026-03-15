<script setup lang="ts">
import type { Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { provideTransport } from "connect-query-vue";
import { VueQueryDevtools } from "@tanstack/vue-query-devtools";
import Example from "./Example.vue";

const props = defineProps<{ transport?: Transport }>();
const finalTransport =
  props.transport ??
  createConnectTransport({
    baseUrl: "https://demo.connectrpc.com",
  });
provideTransport(finalTransport);
</script>

<template>
  <Example />
  <VueQueryDevtools :initial-is-open="true" />
</template>
