import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserBillingStatus(userId: string) {
  const [user] = await db
    .select({
      hasUnlimitedDecks: users.hasUnlimitedDecks,
      hasAIFeature: users.hasAIFeature,
      plan: users.plan,
    })
    .from(users)
    .where(eq(users.id, userId));

  // Return default free user status if user not found
  if (!user) {
    return {
      hasUnlimitedDecks: false,
      hasAIFeature: false,
      plan: "free_user",
    };
  }

  return user;
}

export async function upsertUser(data: {
  id: string;
  email?: string;
  hasUnlimitedDecks?: boolean;
  hasAIFeature?: boolean;
  plan?: string;
}) {
  const [user] = await db
    .insert(users)
    .values({
      id: data.id,
      email: data.email,
      hasUnlimitedDecks: data.hasUnlimitedDecks ?? false,
      hasAIFeature: data.hasAIFeature ?? false,
      plan: data.plan ?? "free_user",
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: data.email,
        hasUnlimitedDecks: data.hasUnlimitedDecks,
        hasAIFeature: data.hasAIFeature,
        plan: data.plan,
        updatedAt: new Date(),
      },
    })
    .returning();

  return user;
}

export async function updateUserBillingStatus(
  userId: string,
  data: {
    hasUnlimitedDecks?: boolean;
    hasAIFeature?: boolean;
    plan?: string;
  }
) {
  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated;
}
