import Link from "next/link";
import { db } from "~/server/db";

export default async function HomePage() {
  const data = await db.query.posts.findMany();

  console.log(data);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1>Wake-Up Call Project</h1>
    </main>
  );
}
