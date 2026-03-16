import { create } from "@bufbuild/protobuf";
import { flushPromises, mount } from "@vue/test-utils";
import { mockPaginatedTransport } from "test-utils";
import { ListResponseSchema, ListService } from "test-utils/gen/list_pb.js";
import type { Plugin } from "vue";
import { defineComponent } from "vue";
import { describe, expect, it, vi } from "vite-plus/test";

import { useMutation } from "./use-mutation.js";
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

describe("useMutation", () => {
  it("performs a mutation", async () => {
    const onSuccess = vi.fn();
    const { plugins, queryClient } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(() => useMutation(methodDescriptor, { onSuccess }), plugins);

    result.mutate({ page: 0n });

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    const callArgs = onSuccess.mock.calls[0];
    expect(callArgs[0]).toEqual(
      create(ListResponseSchema, {
        items: ["-2 Item", "-1 Item", "0 Item"],
        page: 0n,
      }),
    );
    expect(callArgs[1]).toEqual({ page: 0n });
    expect(callArgs[2]).toBeUndefined();
    expect(callArgs[3].client).toBe(queryClient);
  });

  it("can be provided a custom transport", async () => {
    const { plugins } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useMutation(methodDescriptor, {
          transport: mockPaginatedTransport({
            page: 1n,
            items: ["Intercepted!"],
          }),
        }),
      plugins,
    );

    result.mutate({ page: 0n });

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(result.data.value?.items[0]).toBe("Intercepted!");
  });

  it("can forward onMutate params", async () => {
    const onSuccess = vi.fn();
    const { plugins } = wrapper({}, mockedPaginatedTransport);
    const { result } = withSetup(
      () =>
        useMutation(methodDescriptor, {
          onMutate: (variables) => {
            return {
              somethingElse: `Some additional context: ${(variables.page ?? 0n) + 2n}`,
            };
          },
          onSuccess: (data, variables, context) => {
            onSuccess(data, variables, context);
            expect(context.somethingElse).toBe("Some additional context: 2");
          },
        }),
      plugins,
    );

    result.mutate({ page: 0n });

    await flushPromises();

    expect(result.isSuccess.value).toBe(true);
    expect(onSuccess).toHaveBeenCalledWith(
      create(ListResponseSchema, {
        items: ["-2 Item", "-1 Item", "0 Item"],
        page: 0n,
      }),
      { page: 0n },
      { somethingElse: "Some additional context: 2" },
    );
  });
});
