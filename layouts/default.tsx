import { Link } from "@nextui-org/react";

import { Head } from "./head";

import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Head />
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3 fixed bottom-0 bg-background">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://tiplink.io/blinks/donate?dest=D2yGetspd22V3UFHTudRN1s7bU6DF7JNaLBCn2NQ2KHd"
          title="Buy GeekLad a Coffee or a Lambo"
        >
          <span className="text-default-600">Made with ❤️ by GeekLad&nbsp;</span>
          <p className="text-primary">Buy him a coffee or a lambo</p>
        </Link>
      </footer>
    </div>
  );
}
