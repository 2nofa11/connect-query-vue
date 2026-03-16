import { create } from "@bufbuild/protobuf";
import { createConnectQueryKey, skipToken } from "@connectrpc/connect-query-core";
import { flushPromises, mount } from "@vue/test-utils";
import type { Plugin } from "vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it } from "vite-plus/test";

import { BigIntService } from "test-utils/gen/bigint_pb.js";
import { ElizaService } from "test-utils/gen/eliza_pb.js";
import { mockBigInt, mockEliza } from "test-utils";

import { useQuery, useSuspenseQuery } from "./use-query.js";
import { wrapper } from "./test/test-wrapper.js";

const sayMethodDescriptor = ElizaService.method.say;
const mockedElizaTransport = mockEliza();
const bigintTransport = mockBigInt();
const elizaWithDelayTransport = mockEliza(undefined, true);

type Plugins = (Plugin | [Plugin, ...unknown[]])[];

function withSetup<T>(composable: () => T, plugins: Plugins = []): { result: T } {
  let result!: T;
  const TestComponent = defineComponent({
    setup() {
      result = composable();
      return {};
    },
    template: "<div></div>",
  });
  mount(TestComponent, {
    global: { plugins },
  });
  return { result };
}

describe("useQuery", () => {
  it("can query data", async () => {
    const { plugins } = wrapper({}, mockedElizaTransport);
    const { result } = withSetup(
      () => useQuery(sayMethodDescriptor, { sentence: "hello" }),
      plugins,
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(typeof result.data.value?.sentence).toBe("string");
  });

  it("can be disabled", () => {
    const { plugins } = wrapper(undefined, mockedElizaTransport);
    const { result } = withSetup(() => useQuery(sayMethodDescriptor, skipToken), plugins);

    expect(result.isPending.value).toBe(true);
    expect(result.isFetching.value).toBe(false);
  });

  it("can be provided a custom transport", async () => {
    const transport = mockEliza({ sentence: "Intercepted!" });
    const { plugins } = wrapper(undefined, mockedElizaTransport);
    const { result } = withSetup(() => useQuery(sayMethodDescriptor, {}, { transport }), plugins);

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value?.sentence).toBe("Intercepted!");
  });

  it("can be provided other props for vue-query", () => {
    const { plugins } = wrapper(undefined, mockedElizaTransport);
    const { result } = withSetup(
      () =>
        useQuery(
          sayMethodDescriptor,
          {},
          {
            transport: elizaWithDelayTransport,
            placeholderData: create(sayMethodDescriptor.output, {
              sentence: "placeholder!",
            }),
          },
        ),
      plugins,
    );

    expect(result.data.value?.sentence).toBe("placeholder!");
  });

  it("can be used along with the select", async () => {
    const { plugins } = wrapper(undefined, mockedElizaTransport);
    const { result } = withSetup(
      () =>
        useQuery(
          sayMethodDescriptor,
          {},
          {
            select: (data) => data.sentence.length,
          },
        ),
      plugins,
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value).toBe(6);
  });

  it("can be disabled with enabled: false", () => {
    const { plugins } = wrapper({}, mockedElizaTransport);
    const { result } = withSetup(
      () => useQuery(sayMethodDescriptor, { sentence: "hello" }, { enabled: false }),
      plugins,
    );

    expect(result.data.value).toBeUndefined();
    expect(result.isPending.value).toBe(true);
    expect(result.isFetching.value).toBe(false);
  });

  it("can be disabled with enabled: false in QueryClient default options", () => {
    const { plugins } = wrapper(
      { defaultOptions: { queries: { enabled: false } } },
      mockedElizaTransport,
    );
    const { result } = withSetup(
      () => useQuery(sayMethodDescriptor, { sentence: "hello" }),
      plugins,
    );

    expect(result.data.value).toBeUndefined();
    expect(result.isPending.value).toBe(true);
    expect(result.isFetching.value).toBe(false);
  });

  it("can be disabled with skipToken", () => {
    const { plugins } = wrapper({}, mockedElizaTransport);
    const { result } = withSetup(() => useQuery(sayMethodDescriptor, skipToken), plugins);

    expect(result.data.value).toBeUndefined();
    expect(result.isPending.value).toBe(true);
    expect(result.isFetching.value).toBe(false);
  });

  it("supports schemas with bigint keys", async () => {
    const { plugins } = wrapper({}, bigintTransport);
    const { result } = withSetup(() => useQuery(BigIntService.method.count, { add: 2n }), plugins);

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value?.count).toBe(1n);
  });

  it("data can be fetched from cache", async () => {
    const { plugins, queryClient } = wrapper({}, bigintTransport);
    const { result } = withSetup(() => useQuery(BigIntService.method.count, {}), plugins);

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(
      queryClient.getQueryData(
        createConnectQueryKey({
          schema: BigIntService.method.count,
          input: {},
          transport: bigintTransport,
          cardinality: "finite",
        }),
      ),
    ).toStrictEqual(result.data.value);
  });

  it("can accept a reactive input", async () => {
    const { plugins } = wrapper({}, mockedElizaTransport);
    const sentence = ref("world");
    const { result } = withSetup(
      () => useQuery(sayMethodDescriptor, () => ({ sentence: sentence.value })),
      plugins,
    );

    await flushPromises();
    expect(result.data.value?.sentence).toBe("Hello world");

    sentence.value = "vue";
    await flushPromises();
    expect(result.data.value?.sentence).toBe("Hello vue");
  });
});

describe("useSuspenseQuery", () => {
  it("can query data", async () => {
    const { plugins } = wrapper({}, mockedElizaTransport);
    const { result } = withSetup(
      () => useSuspenseQuery(sayMethodDescriptor, { sentence: "hello" }),
      plugins,
    );
    await flushPromises();
    expect(result.isSuccess.value).toBe(true);
    expect(typeof result.data.value?.sentence).toBe("string");
  });

  it("can be used along with the select", async () => {
    const { plugins } = wrapper({}, mockedElizaTransport);
    const { result } = withSetup(
      () =>
        useSuspenseQuery(
          sayMethodDescriptor,
          { sentence: "hello" },
          { select: (data) => data.sentence.length },
        ),
      plugins,
    );
    await flushPromises();
    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value).toBe(11);
  });

  it("can pass headers through", async () => {
    let resolve: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });
    const transport = mockEliza({ sentence: "Response 1" }, false, {
      router: {
        interceptors: [
          (next) => (req) => {
            expect(req.header.get("x-custom-header")).toEqual("custom-value");
            resolve();
            return next(req);
          },
        ],
      },
    });
    const { plugins } = wrapper({}, mockedElizaTransport);
    const { result } = withSetup(
      () =>
        useSuspenseQuery(
          sayMethodDescriptor,
          { sentence: "hello" },
          { transport, headers: { "x-custom-header": "custom-value" } },
        ),
      plugins,
    );
    await flushPromises();
    await promise;
    expect(result.data.value?.sentence).toBe("Response 1");
  });

  it("can accept a reactive input", async () => {
    const { plugins } = wrapper({}, mockedElizaTransport);
    const sentence = ref("world");
    const { result } = withSetup(
      () => useSuspenseQuery(sayMethodDescriptor, () => ({ sentence: sentence.value })),
      plugins,
    );
    await flushPromises();
    expect(result.data.value?.sentence).toBe("Hello world");

    sentence.value = "vue";
    await flushPromises();
    expect(result.data.value?.sentence).toBe("Hello vue");
  });
});
