import { betterAuth } from "better-auth";
import {
  APIError,
  createAuthMiddleware,
} from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaService } from "../prisma/prisma.service.js";

export function createAuth(prisma: PrismaService) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    trustedOrigins: [
      "http://localhost:3005",
      "http://127.0.0.1:3005",
    ],
    emailAndPassword: {
      enabled: true,
    },

    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "STUDENT",
          input: false,
        },
        username: {
          type: "string",
          required: false,
          input: true,
        },
        status: {
          type: "string",
          required: false,
          defaultValue: "ACTIVE",
          input: false,
        },
      },
    },

    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Inactive accounts must not be able to sign in.
        if (ctx.path !== "/sign-in/email") {
          return;
        }

        const email =
          typeof ctx.body?.email === "string"
            ? ctx.body.email.toLowerCase().trim()
            : undefined;

        if (!email) {
          return;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: { status: true },
        });

        if (user?.status === "INACTIVE") {
          throw new APIError("FORBIDDEN", {
            message:
              "This account has been deactivated. Contact an administrator.",
          });
        }
      }),
    },
  });
}