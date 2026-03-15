// Copyright 2021-2023 The Connect Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { Transport } from "@connectrpc/connect";
import type { QueryClientConfig } from "@tanstack/vue-query";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import type { App, Plugin } from "vue";

import { transportKey } from "../use-transport.js";
import { mockEliza } from "./mock-transport.js";

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
