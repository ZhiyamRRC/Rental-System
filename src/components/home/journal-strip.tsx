import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { BlogPost } from "@/db/schema";
import { Reveal } from "@/components/site/reveal";

export function JournalStrip({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section id="journal" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-24 sm:px-6">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-hand text-2xl text-ember">notes from 1,868 metres</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-6xl">
              THE <span className="text-outline">JOURNAL</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-smoke">
              Route guides, mist-season craft and stories from the saddle — written by the crew who
              service these bikes and ride these roads.
            </p>
          </div>
          <Link
            href="/blog"
            className="group flex items-center gap-2 font-display text-sm font-bold tracking-[0.16em] text-ember uppercase"
          >
            Read all stories
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <Reveal key={post.id} delay={i * 0.1}>
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
                <span className="absolute top-4 left-4 rounded-full bg-ink/85 px-3 py-1 font-display text-[10px] font-bold tracking-[0.16em] text-ember uppercase backdrop-blur">
                  {post.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-lg leading-snug font-bold">{post.title}</h3>
                <p className="mt-2.5 line-clamp-2 flex-1 text-sm leading-relaxed text-smoke">{post.excerpt}</p>
                <p className="mt-5 flex items-center gap-3 border-t border-line pt-4 text-xs text-smoke">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3 text-ember" /> {post.readMinutes} min read
                  </span>
                  <span>· {post.author}</span>
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
