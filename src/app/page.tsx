import Link from "next/link";
import { LogInIcon } from "lucide-react";

import { ModeToggle } from "@/components/common/mode-toggle";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex items-center gap-4">
          <ModeToggle />
          <InstallPrompt />
          <Button asChild>
            <Link href="/auth/login">
              <LogInIcon data-icon="inline-start" />
              Masuk
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
