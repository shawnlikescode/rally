import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
} from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export async function AuthShowcase() {
  const user = await currentUser();

  return (
    <div>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-center text-2xl">
            <span>Logged in as {user ? user.id : "Hi"}</span>
          </p>
          <SignOutButton />
        </div>
      </SignedIn>
    </div>
  );
}
