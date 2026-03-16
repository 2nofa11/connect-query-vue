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
