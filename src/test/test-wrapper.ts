import type { Transport } from "@connectrpc/connect";
import type { QueryClientConfig } from "@tanstack/vue-query";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import type { App, Plugin } from "vue";

import { mockEliza } from "test-utils";

import { transportKey } from "../use-transport.js";

type Plugins = (Plugin | [Plugin, ...unknown[]])[];

/**
 * A utils wrapper that supplies @tanstack/vue-query's VueQueryPlugin as well as
 * Connect-Query's transport via Vue's provide/inject mechanism.
 */
export const wrapper = (
  config?: QueryClientConfig,
  transport: Transport = mockEliza(),
): {
  plugins: Plugins;
  queryClientPlugins: Plugins;
  queryClient: QueryClient;
  transport: Transport;
} => {
  const queryClient = new QueryClient(config);
  const transportPlugin: Plugin = {
    install: (app: App) => {
      app.provide(transportKey, transport);
    },
  };

  return {
    plugins: [transportPlugin, [VueQueryPlugin, { queryClient }]],
    queryClientPlugins: [[VueQueryPlugin, { queryClient }]],
    queryClient,
    transport,
  };
};
