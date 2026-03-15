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

import type {
  DescMessage,
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from "@bufbuild/protobuf";
import type { ConnectError, Transport } from "@connectrpc/connect";
import type { ConnectQueryKey, SkipToken } from "@connectrpc/connect-query-core";
import { createQueryOptions } from "@connectrpc/connect-query-core";
import type {
  UseQueryOptions as TanStackUseQueryOptions,
  UseQueryReturnType,
} from "@tanstack/vue-query";
import { useQuery as tsUseQuery } from "@tanstack/vue-query";
import type { MaybeRefOrGetter, Ref } from "vue";
import { computed, toValue } from "vue";

import { useTransport } from "./use-transport.js";

// Extract the plain object type from MaybeRef<T> = Ref<T> | ComputedRef<T> | T
// Exclude removes Ref<unknown> (which also covers ComputedRef<unknown>) leaving just T
type PlainOptions<T> = Exclude<T, Ref<unknown>>;

/**
 * Options for useQuery
 */
export type UseQueryOptions<O extends DescMessage, SelectOutData = MessageShape<O>> = Omit<
  PlainOptions<
    TanStackUseQueryOptions<
      MessageShape<O>,
      ConnectError,
      SelectOutData,
      MessageShape<O>,
      ConnectQueryKey<O>
    >
  >,
  "queryFn" | "queryKey"
> & {
  /** The transport to be used for the fetching. */
  transport?: Transport;
};

/**
 * Query the method provided. Maps to useQuery on @tanstack/vue-query
 */
export function useQuery<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
>(
  schema: DescMethodUnary<I, O>,
  input?: MaybeRefOrGetter<SkipToken | MessageInitShape<I> | undefined>,
  { transport, ...queryOptions }: UseQueryOptions<O, SelectOutData> = {},
): UseQueryReturnType<SelectOutData, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = computed(() =>
    createQueryOptions(schema, toValue(input), {
      transport: transport ?? transportFromCtx,
    }),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return tsUseQuery(
    computed(() => ({ ...baseOptions.value, ...queryOptions }) as any),
  ) as UseQueryReturnType<SelectOutData, ConnectError>;
}
