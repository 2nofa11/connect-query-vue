<script setup lang="ts">
import { useQuery } from "connect-query-vue";
import { say } from "./gen/eliza-ElizaService_connectquery";
import Indicators from "./Indicators.vue";
import Indicator from "./Indicator.vue";
import Data from "./Data.vue";
import Datum from "./Datum.vue";
import Page from "./Page.vue";

const { status, fetchStatus, error, data } = useQuery(say, { sentence: "Hello" });
</script>

<template>
  <Page>
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
  </Page>
</template>
