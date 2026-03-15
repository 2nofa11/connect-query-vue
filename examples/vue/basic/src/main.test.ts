import { createRouterTransport } from "@connectrpc/connect";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";

import * as methods from "./gen/eliza-ElizaService_connectquery";
import App from "./App.vue";

describe("Application", () => {
  it("should show success status and response data", async () => {
    const transport = createRouterTransport(({ rpc }) => {
      rpc(methods.say, () => ({ sentence: "Hello, world!" }));
    });

    const queryClient = new QueryClient();
    const wrapper = mount(App, {
      props: { transport },
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain("Status: success");
    expect(wrapper.find("[aria-labelledby]").text()).toContain(
      '{"$typeName":"connectrpc.eliza.v1.SayResponse","sentence":"Hello, world!"}',
    );
  });
});
