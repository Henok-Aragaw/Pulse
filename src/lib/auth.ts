import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { normalizeName, VALID_DOMAIN } from "./utils";

const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mongodb", 
    }),
    emailAndPassword: {
      enabled:true,
      minPasswordLength:6,
      autoSignIn:false,
    },
    socialProviders: {
      google: {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.NEXT_SECRET_GOOGLE_CLIENT_SECRET as string,
      }
    },
    hooks:{
      before:createAuthMiddleware(async(ctx) => {
        if(ctx.path === '/sign-up/email'){
          const email = String(ctx.body.email);
          const domain = email.split("@")[1];

          if(!VALID_DOMAIN().includes(domain)){
              throw new APIError("BAD_REQUEST", {
                        message:'Invalid domain, Please use a valid email.'
              });
          }

          const name = normalizeName(ctx.body.name);
          
          return {
            context: {
              ...ctx,
              body:{
                ...ctx.body,
                name
              }
            }
          }
        }
      })
    },
    session: {
       expiresIn: 30 * 24 * 60 * 60,
    },
    account: {
      accountLinking:{
        enabled:false
      }
    },
    user:{
      changeEmail: {
        enabled: true
      }
    },
    plugins: [
      nextCookies()
    ]
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | 'unknown'