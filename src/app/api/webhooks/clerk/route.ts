import { Webhook } from "svix";
import { headers } from "next/headers";
import { upsertUser } from "@/db/queries/user-queries";

// Clerk webhook event types we care about
type WebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    public_metadata?: {
      plan?: string;
      features?: string[];
    };
    // For subscription events
    user_id?: string;
    plan?: {
      id: string;
      name: string;
    };
    features?: Array<{
      id: string;
      name: string;
    }>;
  };
};

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  // Handle the webhook event
  const eventType = evt.type;
  console.log(`Received webhook event: ${eventType}`);

  try {
    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, public_metadata } = evt.data;
        const email = email_addresses?.[0]?.email_address;
        const plan = public_metadata?.plan || "free_user";
        const features = public_metadata?.features || [];

        await upsertUser({
          id,
          email,
          plan,
          hasUnlimitedDecks: features.includes("unlimited_decks") || plan === "pro",
          hasAIFeature: features.includes("ai_flashcard_generation") || plan === "pro",
        });

        console.log(`User ${id} upserted with plan: ${plan}`);
        break;
      }

      // Clerk Billing subscription events
      case "subscription.created":
      case "subscription.updated": {
        const userId = evt.data.user_id || evt.data.id;
        const plan = evt.data.plan;
        const features = evt.data.features || [];

        if (userId) {
          const featureNames = features.map((f) => f.name || f.id);
          const isPro = plan?.name === "pro" || plan?.id === "pro";

          await upsertUser({
            id: userId,
            plan: plan?.name || plan?.id || "free_user",
            hasUnlimitedDecks: featureNames.includes("unlimited_decks") || isPro,
            hasAIFeature: featureNames.includes("ai_flashcard_generation") || isPro,
          });

          console.log(`Subscription updated for user ${userId}: ${plan?.name || plan?.id}`);
        }
        break;
      }

      case "subscription.deleted": {
        const userId = evt.data.user_id || evt.data.id;

        if (userId) {
          await upsertUser({
            id: userId,
            plan: "free_user",
            hasUnlimitedDecks: false,
            hasAIFeature: false,
          });

          console.log(`Subscription deleted for user ${userId}, reverted to free`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}
