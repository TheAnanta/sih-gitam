"use client";

import Image from "next/image";
import { Search, Sparkles, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Hero({
  query,
  onQueryChange,
  total,
  domainCount,
  yearCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  total: number;
  domainCount: number;
  yearCount: number;
}) {
  return (
    <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background pt-12 sm:pt-16 lg:pt-20">
      <div className="container mx-auto max-w-4xl space-y-6 px-4 text-center sm:space-y-7 sm:px-6 lg:px-8">
        <p className="text-xs font-medium tracking-wide text-primary uppercase sm:text-sm">
          Smart India Hackathon · {yearCount} year{yearCount === 1 ? "" : "s"} of problem
          statements
        </p>
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          Discover innovative problem statements
          <br className="hidden sm:block" /> and build solutions for India&apos;s future
        </h1>
        <div className="space-y-2">
          <p className="text-base font-semibold sm:text-lg">Stop Scrolling. Start Winning.</p>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Search through curated problem statements from various ministries and
            domains. Use our intelligent search to find challenges that match your
            skills and interests.
          </p>
        </div>

        <div className="relative mx-auto max-w-xl">
          <Search
            className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="problem-search" className="sr-only">
            Search problem statements
          </label>
          <Input
            id="problem-search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search problem statements, ministries, technologies..."
            className="h-12 rounded-full pr-4 pl-11 text-sm shadow-sm sm:h-13 sm:text-base"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 pt-1 text-xs text-muted-foreground sm:text-sm">
          <span className="flex items-center gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            {total} Problems
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            {domainCount} Domains
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            AI-Powered Search
          </span>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="relative sm:hidden" style={{ aspectRatio: "2914 / 1440" }}>
          <div className="blob blob-coral" aria-hidden="true" />
          <Image
            src="/images/hero-team-mobile.png"
            alt="Illustration of a team collaborating on a hackathon project"
            fill
            sizes="(max-width: 640px) 100vw, 768px"
            priority
            className="relative z-10 object-contain"
          />
        </div>
        <Image
          src="/images/hero-team.png"
          alt="Illustration of a team collaborating on a hackathon project"
          width={4194}
          height={1024}
          priority
          className="hidden h-auto w-full sm:block"
        />
      </div>
    </section>
  );
}
