import { authRouter } from "./router/auth";
import { postRouter } from "./router/post";
import { sessionRouter } from "./router/session";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  session: sessionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
