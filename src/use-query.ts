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

/**
 * Options for useQuery
 */
export type UseQueryOptions<O extends DescMessage, SelectOutData = MessageShape<O>> = Omit<
  Exclude<
    TanStackUseQueryOptions<
      MessageShape<O>,
      ConnectError,
      SelectOutData,
      MessageShape<O>,
      ConnectQueryKey<O>
    >,
    Ref<unknown>
  >,
  "queryFn" | "queryKey"
> & {
  /** The transport to be used for the fetching. */
  transport?: Transport;
};

/**
 * Options for useSuspenseQuery
 */
type UseSuspenseQueryOptions<O extends DescMessage, SelectOutData = MessageShape<O>> = Omit<
  Exclude<
    TanStackUseQueryOptions<
      MessageShape<O>,
      ConnectError,
      SelectOutData,
      MessageShape<O>,
      ConnectQueryKey<O>
    >,
    Ref<unknown>
  >,
  "queryFn" | "queryKey" | "enabled" | "placeholderData"
> & {
  /** The transport to be used for the fetching. */
  transport?: Transport;
  /** Headers to be sent with the request. */
  headers?: HeadersInit;
};

/**
 * Merges base options from createQueryOptions with user-supplied options into the type
 * that @tanstack/vue-query's useQuery expects.
 *
 * Type assertion is required here because @tanstack/vue-query wraps TQueryKey with
 * DeepUnwrapRef<> in each option property type (e.g. queryFn, staleTime). TypeScript
 * cannot prove DeepUnwrapRef<ConnectQueryKey<O>> equals ConnectQueryKey<O> for generic O,
 * even though ConnectQueryKey contains no Ref types at runtime.
 */
function mergeQueryOptions<O extends DescMessage, SelectOutData>(
  base: object,
  override: object,
): TanStackUseQueryOptions<
  MessageShape<O>,
  ConnectError,
  SelectOutData,
  MessageShape<O>,
  ConnectQueryKey<O>
> {
  return { ...base, ...override } as unknown as TanStackUseQueryOptions<
    MessageShape<O>,
    ConnectError,
    SelectOutData,
    MessageShape<O>,
    ConnectQueryKey<O>
  >;
}

/**
 * Query the method provided. Maps to useSuspenseQuery on tanstack/react-query
 */
export function useSuspenseQuery<
  I extends DescMessage,
  O extends DescMessage,
  SelectOutData = MessageShape<O>,
>(
  schema: DescMethodUnary<I, O>,
  input?: MaybeRefOrGetter<MessageInitShape<I> | undefined>,
  { transport, headers, ...queryOptions }: UseSuspenseQueryOptions<O, SelectOutData> = {},
): UseQueryReturnType<SelectOutData, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = computed(() =>
    createQueryOptions(schema, toValue(input), {
      transport: transport ?? transportFromCtx,
      headers,
    }),
  );
  return tsUseQuery(() => mergeQueryOptions<O, SelectOutData>(baseOptions.value, queryOptions));
}

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
  return tsUseQuery(() => mergeQueryOptions<O, SelectOutData>(baseOptions.value, queryOptions));
}
