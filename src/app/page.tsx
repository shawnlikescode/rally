export const dynamic = "force-dynamic";
import {SignedIn, SignedOut, SignInButton} from '@clerk/nextjs'
import CreateWakeUpCallForm from './_components/create-wake-up-call-form';

export default async function HomePage() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-white">

      <SignedIn>
        <p>Welcome to Rally!</p>
      </SignedIn>

      <SignedOut>
        <p>Please sign in to continue.</p>
      </SignedOut>

      <h1>Wake-Up Call Project</h1>
      <CreateWakeUpCallForm />
    </main>
  );
}
