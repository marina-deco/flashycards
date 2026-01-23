import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Upgrade to Pro for unlimited decks and AI-powered flashcard generation
          </p>
        </div>

        <PricingTable />
      </div>
    </div>
  );
}
