'use client'

import { useUser } from "@clerk/nextjs";

export default function Home() {

  const { isSignedIn, user, isLoaded } = useUser()

  let html: string = "";

  if (!isLoaded) {
    html = "Loading..."
  } else if (!isSignedIn) {
    html = "Sign in to view this page"
  } else {
    html = `Hello ${user?.username}!`
  }

  
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div>{html}</div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        
      </footer>
    </div>
  );
}
