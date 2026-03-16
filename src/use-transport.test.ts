import { ConnectError } from "@connectrpc/connect";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it } from "vite-plus/test";

import { ElizaService } from "test-utils/gen/eliza_pb.js";
import { mockBigInt } from "test-utils";

import { provideTransport, useTransport } from "./use-transport.js";
import { useQuery } from "./use-query.js";
import { wrapper } from "./test/test-wrapper.js";

const sayMethodDescriptor = ElizaService.method.say;

const fallbackError = new ConnectError(
  "To use Connect, you must provide a `Transport`: a simple object that handles `unary` and `stream` requests. `Transport` objects can easily be created by using `@connectrpc/connect-web`'s exports `createConnectTransport` and `createGrpcWebTransport`. see: https://connectrpc.com/docs/web/getting-started for more info.",
);

describe("useTransport", () => {
  it("throws the fallback error", async () => {
    let queryResult: ReturnType<typeof useQuery> | undefined;

    const TestComponent = defineComponent({
      setup() {
        queryResult = useQuery(sayMethodDescriptor, undefined, { retry: false });
        return {};
      },
      template: "<div></div>",
    });

    const { queryClientPlugins } = wrapper();
    mount(TestComponent, {
      global: { plugins: queryClientPlugins },
    });

    await flushPromises();

    expect(queryResult?.isError.value).toBe(true);
    expect(queryResult?.error.value).toEqual(fallbackError);
  });
});

describe("provideTransport", () => {
  it("provides a custom transport to the useTransport hook", () => {
    const transport = mockBigInt();
    let capturedTransport: ReturnType<typeof useTransport> | undefined;

    // inject() reads from ancestor components, not the same component.
    // So we need a parent that provides and a child that injects.
    const ChildComponent = defineComponent({
      setup() {
        capturedTransport = useTransport();
        return {};
      },
      template: "<div></div>",
    });

    const ParentComponent = defineComponent({
      components: { ChildComponent },
      setup() {
        provideTransport(transport);
        return {};
      },
      template: "<ChildComponent />",
    });

    mount(ParentComponent);

    expect(capturedTransport).toBe(transport);
  });
});
