export const runtime = "nodejs";

import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { normalizeName, VALID_DOMAIN } from "./utils";
import { Import } from "lucide-react";

const prisma = new PrismaClient();

let authInstance: ReturnType<typeof betterAuth> | null = null;

try {
  authInstance = betterAuth({
    database: prismaAdapter(prisma, {
      provider: "mongodb",
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      autoSignIn: false,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") {
          const email = String(ctx.body.email);
          const domain = email.split("@")[1];

          if (!VALID_DOMAIN().includes(domain)) {
            throw new APIError("BAD_REQUEST", {
              message: "Invalid domain. Please use a valid email.",
            });
          }

          const name = normalizeName(ctx.body.name);
          return {
            context: {
              ...ctx,
              body: { ...ctx.body, name },
            },
          };
        }
      }),
    },
    session: {
      expiresIn: 30 * 24 * 60 * 60,
    },
    account: {
      accountLinking: {
        enabled: false,
      },
    },
    user: {
      changeEmail: {
        enabled: true,
      },
    },
    plugins: [nextCookies()],
  });
} catch (error) {
  console.error("❌ BetterAuth initialization failed:", error);
}

export const auth = authInstance!;

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "unknown";
