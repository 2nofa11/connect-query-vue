import type {
  DescMessage,
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from "@bufbuild/protobuf";
import type { ConnectError, Transport } from "@connectrpc/connect";
import type { ConnectInfiniteQueryOptions, ConnectQueryKey } from "@connectrpc/connect-query-core";
import { createInfiniteQueryOptions } from "@connectrpc/connect-query-core";
import type {
  InfiniteData,
  SkipToken,
  UseInfiniteQueryOptions as TanStackUseInfiniteQueryOptions,
  UseInfiniteQueryReturnType,
} from "@tanstack/vue-query";
import { useInfiniteQuery as tsUseInfiniteQuery } from "@tanstack/vue-query";
import type { MaybeRefOrGetter, Ref } from "vue";
import { computed, toValue } from "vue";

import { useTransport } from "./use-transport.js";

/**
 * Options for useInfiniteQuery
 */
export type UseInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends keyof MessageInitShape<I>,
  SelectOutData = MessageShape<O>,
  SelectOutPageParam = MessageInitShape<I>[ParamKey],
> = Omit<
  Exclude<
    TanStackUseInfiniteQueryOptions<
      MessageShape<O>,
      ConnectError,
      InfiniteData<SelectOutData, SelectOutPageParam>,
      ConnectQueryKey<O>,
      MessageInitShape<I>[ParamKey]
    >,
    Ref<unknown>
  >,
  "getNextPageParam" | "initialPageParam" | "queryFn" | "queryKey"
> &
  ConnectInfiniteQueryOptions<I, O, ParamKey> & {
    /** The transport to be used for the fetching. */
    transport?: Transport;
  };

/**
 * Merges base options from createInfiniteQueryOptions with user-supplied options into the type
 * that @tanstack/vue-query's useInfiniteQuery expects.
 *
 * Type assertion is required here because @tanstack/vue-query wraps TQueryKey with
 * DeepUnwrapRef<> in each option property type (e.g. queryFn, staleTime). TypeScript
 * cannot prove DeepUnwrapRef<ConnectQueryKey<O>> equals ConnectQueryKey<O> for generic O,
 * even though ConnectQueryKey contains no Ref types at runtime.
 */
function mergeInfiniteQueryOptions<O extends DescMessage, SelectOutData, SelectOutPageParam>(
  base: object,
  override: object,
): TanStackUseInfiniteQueryOptions<
  MessageShape<O>,
  ConnectError,
  InfiniteData<SelectOutData, SelectOutPageParam>,
  ConnectQueryKey<O>,
  SelectOutPageParam
> {
  return { ...base, ...override } as TanStackUseInfiniteQueryOptions<
    MessageShape<O>,
    ConnectError,
    InfiniteData<SelectOutData, SelectOutPageParam>,
    ConnectQueryKey<O>,
    SelectOutPageParam
  >;
}

/**
 * Query the method provided. Maps to useInfiniteQuery on @tanstack/vue-query
 */
export function useInfiniteQuery<
  I extends DescMessage,
  O extends DescMessage,
  const ParamKey extends keyof MessageInitShape<I>,
  SelectOutData = MessageShape<O>,
  SelectOutPageParam = MessageInitShape<I>[ParamKey],
>(
  schema: DescMethodUnary<I, O>,
  input: MaybeRefOrGetter<
    SkipToken | (MessageInitShape<I> & Required<Pick<MessageInitShape<I>, ParamKey>>)
  >,
  {
    transport,
    pageParamKey,
    getNextPageParam,
    ...queryOptions
  }: UseInfiniteQueryOptions<I, O, ParamKey, SelectOutData, SelectOutPageParam>,
): UseInfiniteQueryReturnType<InfiniteData<SelectOutData, SelectOutPageParam>, ConnectError> {
  const transportFromCtx = useTransport();
  const baseOptions = computed(() =>
    createInfiniteQueryOptions(schema, toValue(input), {
      transport: transport ?? transportFromCtx,
      getNextPageParam,
      pageParamKey,
    }),
  );
  return tsUseInfiniteQuery(() =>
    mergeInfiniteQueryOptions<O, SelectOutData, SelectOutPageParam>(
      baseOptions.value,
      queryOptions,
    ),
  );
}
