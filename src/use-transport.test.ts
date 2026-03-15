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

import { ConnectError } from "@connectrpc/connect";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it } from "vite-plus/test";

import { provideTransport, useTransport } from "./use-transport.js";
import { useQuery } from "./use-query.js";
import { ElizaService } from "./test/gen/eliza_pb.js";
import { mockBigInt } from "./test/mock-transport.js";
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
