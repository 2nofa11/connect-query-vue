import { create } from "@bufbuild/protobuf";
import { createConnectQueryKey, skipToken } from "@connectrpc/connect-query-core";
import { flushPromises, mount } from "@vue/test-utils";
import { QueryCache } from "@tanstack/vue-query";
import type { Plugin } from "vue";
import { defineComponent, ref } from "vue";
import { describe, expect, expectTypeOf, it, vi } from "vite-plus/test";

import { ListService, ListRequestSchema, ListResponseSchema } from "test-utils/gen/list_pb.js";
import { mockPaginatedTransport } from "test-utils";

import { useInfiniteQuery, useSuspenseInfiniteQuery } from "./use-infinite-query.js";
import { useQuery } from "./use-query.js";
import { wrapper } from "./test/test-wrapper.js";

const methodDescriptor = ListService.method.list;
const mockedPaginatedTransport = mockPaginatedTransport();

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

describe("useInfiniteQuery", () => {
  it("can query paginated data", async () => {
    const { plugins } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        ),
      plugins,
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value).toEqual({
      pageParams: [0n],
      pages: [
        create(ListResponseSchema, {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        }),
      ],
    });

    await result.fetchNextPage();
    await flushPromises();

    expect(result.isFetching.value).toBe(false);
    expect(result.data.value).toEqual({
      pageParams: [0n, 1n],
      pages: [
        create(ListResponseSchema, {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        }),
        create(ListResponseSchema, {
          items: ["1 Item", "2 Item", "3 Item"],
          page: 1n,
        }),
      ],
    });
  });

  it("can be disabled with skipToken", () => {
    const { plugins } = wrapper(undefined, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useInfiniteQuery(methodDescriptor, skipToken, {
          getNextPageParam: (lastPage) => lastPage.page + 1n,
          pageParamKey: "page",
        }),
      plugins,
    );

    expect(result.isPending.value).toBe(true);
    expect(result.isFetching.value).toBe(false);
  });

  it("can be provided a custom transport", async () => {
    const customTransport = mockPaginatedTransport({
      items: ["Intercepted!"],
      page: 0n,
    });
    const { plugins } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
            transport: customTransport,
          },
        ),
      plugins,
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value?.pages[0].items).toEqual(["Intercepted!"]);
  });

  it("can be provided other props for vue-query", () => {
    const { plugins } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
            transport: mockPaginatedTransport(undefined, true),
            placeholderData: {
              pageParams: [-1n],
              pages: [
                create(methodDescriptor.output, {
                  page: -1n,
                  items: [],
                }),
              ],
            },
          },
        ),
      plugins,
    );

    expect(result.data.value?.pages[0].page).toEqual(-1n);
  });

  it("can be used along with the select", async () => {
    const { plugins } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            select: ({ pages, pageParams }) => ({
              pages: pages.map((p) => p.items.join(",")),
              pageParams: pageParams.map((p) => p?.toString()),
            }),
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        ),
      plugins,
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value).toEqual({
      pageParams: ["0"],
      pages: ["-2 Item,-1 Item,0 Item"],
    });

    await result.fetchNextPage();
    await flushPromises();

    expect(result.isFetching.value).toBe(false);
    expect(result.data.value).toEqual({
      pageParams: ["0", "1"],
      pages: ["-2 Item,-1 Item,0 Item", "1 Item,2 Item,3 Item"],
    });
  });

  it("page param doesn't persist to the query cache", async () => {
    const { plugins, queryClient } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        ),
      plugins,
    );

    const cache = queryClient.getQueryCache().getAll();

    expect(cache).toHaveLength(1);
    expect(cache[0].queryKey).toEqual(
      createConnectQueryKey({
        schema: methodDescriptor,
        transport: mockedPaginatedTransport,
        cardinality: "infinite",
        pageParamKey: "page",
        input: {},
      }),
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value?.pageParams[0]).toEqual(0n);
  });

  it("doesn't share data with a similar non-infinite query", async () => {
    const { plugins } = wrapper({}, mockedPaginatedTransport);
    const { result: infiniteResult } = withSetup(
      () =>
        useInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        ),
      plugins,
    );

    await flushPromises();

    expect(infiniteResult.isSuccess.value).toBe(true);
    expect(infiniteResult.data.value?.pages[0].items).toHaveLength(3);

    const { result: queryResult } = withSetup(() => useQuery(methodDescriptor), plugins);

    await flushPromises();

    expect(queryResult.isSuccess.value).toBe(true);
    expect(queryResult.data.value?.items).toHaveLength(3);
  });

  it("cache can be invalidated with the shared, non-infinite key", async () => {
    const onSuccessSpy = vi.fn();
    const spiedQueryCache = new QueryCache({ onSuccess: onSuccessSpy });
    const { plugins, queryClient } = wrapper(
      { queryCache: spiedQueryCache },
      mockedPaginatedTransport,
    );
    const { result } = withSetup(
      () =>
        useInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        ),
      plugins,
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(onSuccessSpy).toHaveBeenCalledTimes(1);

    await queryClient.invalidateQueries({
      queryKey: createConnectQueryKey({
        schema: methodDescriptor,
        transport: mockedPaginatedTransport,
        cardinality: undefined,
        pageParamKey: "page",
        input: { page: 0n },
      }),
    });
    await flushPromises();

    expect(onSuccessSpy).toHaveBeenCalledTimes(2);
  });

  it("cache can be invalidated with a non-exact key", async () => {
    const onSuccessSpy = vi.fn();
    const spiedQueryCache = new QueryCache({ onSuccess: onSuccessSpy });
    const { plugins, queryClient } = wrapper(
      { queryCache: spiedQueryCache },
      mockedPaginatedTransport,
    );
    const { result } = withSetup(
      () =>
        useInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        ),
      plugins,
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(onSuccessSpy).toHaveBeenCalledTimes(1);

    await queryClient.invalidateQueries({
      exact: false,
      queryKey: createConnectQueryKey({
        schema: methodDescriptor,
        cardinality: "infinite",
      }),
    });
    await flushPromises();

    expect(onSuccessSpy).toHaveBeenCalledTimes(2);
  });

  it("can query paginated data with a non-zero page param", async () => {
    const { plugins, queryClient } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useInfiniteQuery(
          methodDescriptor,
          { page: 1n, preview: true },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        ),
      plugins,
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value?.pages[0].items).toEqual(["1 Item", "2 Item", "3 Item"]);

    const manuallyCreatedQueryKey = createConnectQueryKey({
      schema: methodDescriptor,
      transport: mockedPaginatedTransport,
      cardinality: "infinite",
      pageParamKey: "page",
      input: create(ListRequestSchema, { preview: true }),
    });
    expect(queryClient.getQueryData(manuallyCreatedQueryKey)).toEqual(result.data.value);
  });

  // TODO: requires @connectrpc/connect-query-core to release deep page key support (connectrpc/connect-query-es#572)
  it.todo("builds nested page input for successive pages");

  it("can accept a reactive input", async () => {
    const { plugins, queryClient } = wrapper({}, mockedPaginatedTransport);
    const preview = ref(false);
    withSetup(
      () =>
        useInfiniteQuery(methodDescriptor, () => ({ page: 0n, preview: preview.value }), {
          getNextPageParam: (lastPage) => lastPage.page + 1n,
          pageParamKey: "page",
        }),
      plugins,
    );

    await flushPromises();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);

    preview.value = true;
    await flushPromises();
    // preview is not the pageParamKey, so it is part of the query key → new cache entry
    expect(queryClient.getQueryCache().getAll()).toHaveLength(2);
  });
});

describe("useSuspenseInfiniteQuery", () => {
  it("can query paginated data", async () => {
    const { plugins } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useSuspenseInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
          },
        ),
      plugins,
    );

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value).toEqual({
      pageParams: [0n],
      pages: [
        create(ListResponseSchema, {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        }),
      ],
    });

    await result.fetchNextPage();
    await flushPromises();

    expect(result.isFetching.value).toBe(false);
    expect(result.data.value).toEqual({
      pageParams: [0n, 1n],
      pages: [
        create(ListResponseSchema, {
          items: ["-2 Item", "-1 Item", "0 Item"],
          page: 0n,
        }),
        create(ListResponseSchema, {
          items: ["1 Item", "2 Item", "3 Item"],
          page: 1n,
        }),
      ],
    });
  });

  it("can not be disabled with skipToken", () => {
    expectTypeOf(useSuspenseInfiniteQuery).parameter(1).not.toMatchTypeOf<typeof skipToken>();
  });

  it("does not allow excess properties", () => {
    expectTypeOf(useSuspenseInfiniteQuery)
      .parameter(1)
      .not.toMatchTypeOf<{ page: bigint; extraField: string }>();
  });

  it("can pass headers through", async () => {
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });
    const transport = mockPaginatedTransport({ items: ["Intercepted!"], page: 0n }, false, {
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
    const { plugins } = wrapper({});
    const { result } = withSetup(
      () =>
        useSuspenseInfiniteQuery(
          methodDescriptor,
          { page: 0n },
          {
            getNextPageParam: (lastPage) => lastPage.page + 1n,
            pageParamKey: "page",
            transport,
            headers: { "x-custom-header": "custom-value" },
          },
        ),
      plugins,
    );

    await flushPromises();
    await promise;

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value?.pages[0].items).toEqual(["Intercepted!"]);
  });
});
