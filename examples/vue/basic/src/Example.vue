<script setup lang="ts">
import { useMutation, useQuery } from "connect-query-vue";
import { useQueryClient } from "@tanstack/vue-query";
import { ref } from "vue";
import { say } from "./gen/eliza-ElizaService_connectquery";
import Indicators from "./Indicators.vue";
import Indicator from "./Indicator.vue";
import Data from "./Data.vue";
import Datum from "./Datum.vue";
import Page from "./Page.vue";

const queryClient = useQueryClient();
const mutationSentence = ref("");

const { status, fetchStatus, error, data } = useQuery(say, { sentence: "Hello" });

const {
  status: mutationStatus,
  data: mutationData,
  mutate,
} = useMutation(say, {
  onSuccess: () => {
    queryClient.invalidateQueries();
  },
});
</script>

<template>
  <Page>
    <h2>useQuery</h2>
    Status: {{ status }}
    <Indicators label="queryStatus">
      <Indicator label="pending" :parent="status" />
      <Indicator label="success" :parent="status" />
      <Indicator label="error" :parent="status" />
    </Indicators>
    <Indicators label="fetchStatus">
      <Indicator label="fetching" :parent="fetchStatus" />
      <Indicator label="idle" :parent="fetchStatus" />
      <Indicator label="paused" :parent="fetchStatus" />
    </Indicators>
    <Data>
      <Datum label="data" :datum="JSON.stringify(data)" />
      <Datum label="error" :datum="JSON.stringify(error)" />
    </Data>

    <h2>useMutation</h2>
    <div>
      <input v-model="mutationSentence" placeholder="Enter sentence" />
      <button @click="mutate({ sentence: mutationSentence })">Send</button>
    </div>
    Status: {{ mutationStatus }}
    <Indicators label="mutationStatus">
      <Indicator label="idle" :parent="mutationStatus" />
      <Indicator label="pending" :parent="mutationStatus" />
      <Indicator label="success" :parent="mutationStatus" />
      <Indicator label="error" :parent="mutationStatus" />
    </Indicators>
    <Data>
      <Datum label="response" :datum="mutationData?.sentence ?? ''" />
    </Data>
  </Page>
</template>
