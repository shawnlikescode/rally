import { cache } from "react";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createHydrationHelpers } from "@trpc/react-query/rsc";

import type { AppRouter } from "@rally/api";
import { createCaller, createTRPCContext } from "@rally/api";

import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(() => {
  return createTRPCContext({
    headers: new Headers({
      cookie: cookies().toString(),
      "x-trpc-source": "rsc",
    }),
    auth: getAuth(
      new NextRequest("https://placeholder.com", { headers: headers() }),
    ),
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
