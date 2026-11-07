import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, Clock, Newspaper } from "lucide-react";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { Reveal } from "@/components/site/reveal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Journal — Routes, safety & stories from the hills",
  description:
    "Route guides, riding-safety advice and traveller stories from the Ceylon Ride Co. crew in Nuwara Eliya, Sri Lanka's tea country.",
};

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogIndexPage() {
  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.featured), desc(blogPosts.publishedAt));

  const [lead, ...rest] = posts;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-36 pb-24 sm:px-6">
      <header className="max-w-2xl">
        <p className="font-hand text-2xl text-ember">notes from 1,868 metres</p>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight sm:text-7xl">
          THE <span className="text-outline">JOURNAL</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-smoke sm:text-base">
          Route guides, weather craft and stories from our crew and the riders who take our keys —
          everything we wish we had known before our first lap of the tea country.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-dashed border-line py-24 text-center">
          <Newspaper className="mx-auto size-10 text-smoke" />
          <p className="mt-4 font-display text-xl font-bold">No stories published yet</p>
          <p className="mt-2 text-sm text-smoke">Check back soon — the crew is writing.</p>
        </div>
      ) : (
        <>
          {lead && (
            <Reveal>
              <Link
                href={`/blog/${lead.slug}`}
                className="group mt-12 grid overflow-hidden rounded-3xl border border-line bg-carbon transition-colors hover:border-ember/50 lg:grid-cols-2"
              >
                <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-80">
                  <Image
                    src={lead.coverImage || "/img/about.jpg"}
                    alt={lead.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-5 left-5 rounded-full bg-ember px-3 py-1 font-display text-[10px] font-bold tracking-[0.18em] text-ink uppercase">
                    Featured
                  </span>
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <div className="flex items-center gap-3 text-[11px] tracking-[0.16em] text-smoke uppercase">
                    <span className="text-ember">{lead.category}</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3" /> {lead.readMinutes} min
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                    {lead.title}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-smoke">{lead.excerpt}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-xs text-smoke">
                      {lead.author} · {fmt(lead.publishedAt)}
                    </p>
                    <span className="flex items-center gap-1.5 font-display text-xs font-bold tracking-[0.14em] text-ember uppercase">
                      Read <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          )}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.08}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-carbon transition-all duration-500 hover:-translate-y-1 hover:border-ember/50"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={post.coverImage || "/img/about.jpg"}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3 text-[11px] tracking-[0.16em] text-smoke uppercase">
                      <span className="text-ember">{post.category}</span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3" /> {post.readMinutes} min
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-lg leading-snug font-bold">{post.title}</h3>
                    <p className="mt-2.5 line-clamp-3 flex-1 text-sm leading-relaxed text-smoke">{post.excerpt}</p>
                    <p className="mt-5 border-t border-line pt-4 text-xs text-smoke">
                      {post.author} · {fmt(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
