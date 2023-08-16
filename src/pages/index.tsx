import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";

export default function Home() {
  const session = useSession();

  return (
    <>
      <Head>
        <title>retrobro</title>
        <meta name="description" content="sprint retros i guess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          TODO create a room button, login button
        </div>
      </main>
    </>
  );
}



