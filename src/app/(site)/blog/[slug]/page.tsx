import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { ArrowLeft, ArrowUpRight, Clock, User } from "lucide-react";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { Reveal } from "@/components/site/reveal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  if (!post) return { title: "Story not found" };
  return {
    title: post.title,
    description: post.excerpt || post.content.slice(0, 150),
    openGraph: { images: post.coverImage ? [post.coverImage] : [] },
  };
}

/** Lightweight renderer: "## " headings, "- " bullets, "1. " ordered, blank-line paragraphs. */
function RenderContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        const trimmed = block.trim();

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="pt-4 font-display text-2xl font-bold tracking-tight text-mist sm:text-3xl">
              {trimmed.slice(3)}
            </h2>
          );
        }

        const lines = trimmed.split("\n").map((l) => l.trim());
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="space-y-2.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3 text-base leading-relaxed text-mist/75">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ember" />
                  <span>{renderInline(l.slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={i} className="space-y-2.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3 text-base leading-relaxed text-mist/75">
                  <span className="font-display text-sm font-bold text-ember">{j + 1}.</span>
                  <span>{renderInline(l.replace(/^\d+\.\s/, ""))}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={i} className="text-base leading-relaxed text-mist/75">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/** Supports **bold** inline emphasis. */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-mist">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  if (!post || !post.published) notFound();

  const more = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.published, true), ne(blogPosts.id, post.id)))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(3);

  return (
    <article className="mx-auto max-w-3xl px-4 pt-32 pb-24 sm:px-6">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 font-display text-xs font-bold tracking-[0.18em] text-smoke uppercase transition-colors hover:text-ember"
      >
        <ArrowLeft className="size-4" /> All stories
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3 text-[11px] tracking-[0.16em] text-smoke uppercase">
          <span className="rounded-full bg-ember px-3 py-1 font-bold text-ink">{post.category}</span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3" /> {post.readMinutes} min read
          </span>
          <span className="flex items-center gap-1.5">
            <User className="size-3" /> {post.author}
          </span>
          <span>
            {new Date(post.publishedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-mist/70">{post.excerpt}</p>}
      </header>

      {post.coverImage && (
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl border border-line">
          <Image src={post.coverImage} alt={post.title} fill priority sizes="100vw" className="object-cover" />
        </div>
      )}

      <div className="mt-12">
        <RenderContent content={post.content} />
      </div>

      {post.tags.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2 border-t border-line pt-8">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full border border-line px-3 py-1 text-xs text-smoke">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-ember/40 bg-ember/10 p-7">
        <div>
          <p className="font-display text-xl font-bold">Ready to ride this yourself?</p>
          <p className="mt-1 text-sm text-smoke">Bikes from $9/day, delivered to your hotel in Nuwara Eliya.</p>
        </div>
        <Link
          href="/fleet"
          className="flex items-center gap-2 rounded-full bg-ember px-6 py-3 font-display text-xs font-bold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-amber"
        >
          Browse the fleet <ArrowUpRight className="size-4" />
        </Link>
      </div>

      {more.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold tracking-tight">KEEP <span className="text-outline">READING</span></h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {more.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-carbon transition-colors hover:border-ember/50"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={p.coverImage || "/img/about.jpg"}
                      alt={p.title}
                      fill
                      sizes="33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold tracking-[0.16em] text-ember uppercase">{p.category}</p>
                    <p className="mt-1.5 line-clamp-2 font-display text-sm leading-snug font-bold">{p.title}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
