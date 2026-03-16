import type {
  DescMessage,
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from "@bufbuild/protobuf";
import type { ConnectError, Transport } from "@connectrpc/connect";
import { callUnaryMethod } from "@connectrpc/connect-query-core";
import type {
  UseMutationOptions as TSUseMutationOptions,
  UseMutationReturnType,
} from "@tanstack/vue-query";
import { useMutation as tsUseMutation } from "@tanstack/vue-query";

import { useTransport } from "./use-transport.js";

/**
 * Options for useMutation
 */
export type UseMutationOptions<
  I extends DescMessage,
  O extends DescMessage,
  Ctx = unknown,
> = TSUseMutationOptions<MessageShape<O>, ConnectError, MessageInitShape<I>, Ctx> & {
  /** The transport to be used for the fetching. */
  transport?: Transport;
};

/**
 * Query the method provided. Maps to useMutation on @tanstack/vue-query
 */
export function useMutation<I extends DescMessage, O extends DescMessage, Ctx = unknown>(
  schema: DescMethodUnary<I, O>,
  { transport, ...queryOptions }: UseMutationOptions<I, O, Ctx> = {},
): UseMutationReturnType<MessageShape<O>, ConnectError, MessageInitShape<I>, Ctx> {
  const transportFromCtx = useTransport();
  const transportToUse = transport ?? transportFromCtx;
  return tsUseMutation({
    ...queryOptions,
    mutationFn: (input: MessageInitShape<I>) => callUnaryMethod(transportToUse, schema, input),
  });
}
