export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <main className="flex w-full max-w-4xl flex-col items-center gap-12 text-center">
        {/* Hero Section */}
        <div className="flex flex-col gap-6">
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
            Welcome to{" "}
            <span className="text-cyan-500">Flashy Cardy Course</span>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Master any subject with our interactive flashcard learning system.
            <br />
            Create, study, and track your progress all in one place.
          </p>
        </div>

        {/* Get Started Card */}
        <div className="w-full max-w-2xl rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">Get Started Today</h2>
          <p className="mb-2 text-muted-foreground">
            Sign up or sign in to start creating your personalized flashcard
            decks.
          </p>
          <p className="text-sm text-muted-foreground">
            Click the buttons in the header above to get started! 💡
          </p>
        </div>
      </main>
    </div>
  );
}
