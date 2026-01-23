import { SignIn, SignUp, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";

export default async function Home() {
  const { userId } = await auth();
  
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-6xl font-bold tracking-tight">FlashyCardy</h1>
          <p className="text-xl text-muted-foreground">
            Your personal flashcard platform
          </p>
        </div>
        
        <SignedOut>
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">Sign In</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="sr-only">Sign In</DialogTitle>
                <SignIn routing="hash" forceRedirectUrl="/dashboard" />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg">Sign Up</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="sr-only">Sign Up</DialogTitle>
                <SignUp routing="hash" forceRedirectUrl="/dashboard" />
              </DialogContent>
            </Dialog>
          </div>
        </SignedOut>
      </div>
    </div>
  );
}
