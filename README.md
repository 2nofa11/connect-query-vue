# connect-query-vue

Vue adapter for [connect-query-core](https://github.com/connectrpc/connect-query-es), bringing Connect RPC support to [@tanstack/vue-query](https://tanstack.com/query/latest/docs/framework/vue/overview).

This package is inspired by [connectrpc/connect-query-es#324](https://github.com/connectrpc/connect-query-es/issues/324), which tracks extending connect-query-es to frameworks beyond React. It depends on `@connectrpc/connect-query-core` and provides Vue-specific composables on top of it.

## Installation

```bash
npm install connect-query-vue @connectrpc/connect-query-core @connectrpc/connect @bufbuild/protobuf @tanstack/vue-query vue
```

## Usage

### Setup

Provide a Connect transport in your app:

```ts
import { createConnectTransport } from "@connectrpc/connect-web";
import { TransportKey } from "connect-query-vue";
import { createApp } from "vue";
import App from "./App.vue";

const transport = createConnectTransport({ baseUrl: "https://demo.connectrpc.com" });

const app = createApp(App);
app.provide(TransportKey, transport);
app.mount("#app");
```

### useQuery

```vue
<script setup lang="ts">
import { useQuery } from "connect-query-vue";
import { ElizaService } from "./gen/eliza_pb";

const { data, isPending } = useQuery(ElizaService.say, { sentence: "Hello" });
</script>

<template>
  <div v-if="isPending">Loading...</div>
  <div v-else>{{ data?.sentence }}</div>
</template>
```

## API

### `useQuery(methodSig, input?, options?)`

A composable wrapper around `@tanstack/vue-query`'s `useQuery`. Automatically builds the query key and fetcher using `connect-query-core`.

### `useTransport()`

Returns the Connect transport provided via `TransportKey`.

## Development

```bash
# Install dependencies
vp install

# Run tests
vp test

# Build
vp pack
```

## Related

- [connectrpc/connect-query-es](https://github.com/connectrpc/connect-query-es) — React adapter (official)
- [@connectrpc/connect-query-core](https://www.npmjs.com/package/@connectrpc/connect-query-core) — Framework-agnostic core
