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
import { ConnectError } from "@connectrpc/connect";
import type { InjectionKey } from "vue";
import { inject, provide } from "vue";

const fallbackTransportError = new ConnectError(
  "To use Connect, you must provide a `Transport`: a simple object that handles `unary` and `stream` requests. `Transport` objects can easily be created by using `@connectrpc/connect-web`'s exports `createConnectTransport` and `createGrpcWebTransport`. see: https://connectrpc.com/docs/web/getting-started for more info.",
);

// istanbul ignore next
export const fallbackTransport: Transport = {
  unary: () => {
    throw fallbackTransportError;
  },
  stream: () => {
    throw fallbackTransportError;
  },
};

export const transportKey: InjectionKey<Transport> = Symbol("transport");

/**
 * Use this helper to get the default transport that's currently attached to the Vue context for the calling component.
 */
export const useTransport = (): Transport => inject(transportKey, fallbackTransport);

/**
 * Provide a transport to all child components via Vue's provide/inject mechanism.
 * Must be called in a component's setup() function.
 */
export const provideTransport = (transport: Transport): void => {
  provide(transportKey, transport);
};
