import React from "react";
import { getApiKeys } from "@/actions/api-key-actions";
import { getUser } from "@/lib/auth/auth-session";
import { prisma } from "@nsfw/db";
import ApiKeysClient from "./api-keys-client";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const user = await getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const isAdmin = dbUser?.role === "admin";
  
  const keys = await getApiKeys();

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys to access the NSFW detection service.
          </p>
        </div>

        <ApiKeysClient initialKeys={keys} isAdmin={isAdmin || false} />
      </div>
    </div>
  );
}
