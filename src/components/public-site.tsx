import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { chapterProfile, publicImages, publicNavItems } from "@/lib/public-site";

export function PublicSiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="grain min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="chapter-halo pointer-events-none absolute left-1/2 top-0 h-72 w-[min(70rem,92vw)] -translate-x-1/2 blur-3xl" />
        <PublicSiteHeader />
        <main className="relative z-10 flex-1">{children}</main>
        <PublicSiteFooter />
      </div>
    </div>
  );
}

export function PublicSiteHeader() {
  return (
    <header className="panel relative z-10 mb-6 overflow-hidden rounded-[2rem] px-4 py-4 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 border-b border-[var(--line)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Public site scaffold</p>
          <Link href="/" className="display-title text-3xl font-semibold text-[var(--forest)]">
            {chapterProfile.shortName}
          </Link>
          <p className="muted mt-2 max-w-2xl text-sm sm:text-base">
            {chapterProfile.name} public website baseline for announcements,
            schedule updates, and downloadable family resources.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="button-secondary" href="/contact">
            Family contact
          </Link>
          <Link className="button-secondary" href="/auth/sign-in">
            Staff sign in
          </Link>
        </div>
      </div>

      <nav aria-label="Primary" className="-mx-2 overflow-x-auto px-2">
        <ul className="flex min-w-max gap-2 pb-1">
          {publicNavItems.map((item) => (
            <li key={item.href}>
              <Link className="nav-pill" href={item.href}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function PublicSiteFooter() {
  return (
    <footer className="panel relative z-10 mt-8 rounded-[2rem] px-5 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="eyebrow mb-2">Built for parents first</p>
          <h2 className="display-title text-3xl font-semibold text-[var(--forest)]">
            One place for chapter updates, schedules, and files.
          </h2>
          <p className="muted mt-3 max-w-2xl">
            The public site is intentionally separate from the internal admin,
            CRM, and registration surfaces so chapter staff can publish useful
            information without exposing private family data.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {publicNavItems.map((item) => (
            <Link key={item.href} className="rounded-[1.25rem] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm font-semibold text-[var(--forest)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]" href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
  actions?: ReactNode;
  aside?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  image,
  actions,
  aside,
}: PageHeaderProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-8">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="display-title max-w-3xl text-4xl font-semibold leading-tight text-[var(--forest)] sm:text-5xl">
          {title}
        </h1>
        <p className="muted mt-4 max-w-2xl text-base sm:text-lg">{description}</p>
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        {aside ? <div className="mt-6">{aside}</div> : null}
      </div>

      <PhotoCard image={image} />
    </section>
  );
}

export function PhotoCard({
  image,
  caption,
}: {
  image: { src: string; alt: string };
  caption?: string;
}) {
  return (
    <div className="panel overflow-hidden rounded-[2rem]">
      <div className="relative aspect-[4/3] min-h-[18rem]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority={image.src === publicImages.homeHero.src}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 42vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,25,33,0.08),rgba(15,25,33,0.42))]" />
      </div>
      {caption ? (
        <div className="border-t border-[var(--line)] bg-[rgba(255,250,244,0.82)] px-4 py-3 text-sm text-[var(--muted)]">
          {caption}
        </div>
      ) : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h2 className="display-title text-3xl font-semibold text-[var(--forest)] sm:text-4xl">
        {title}
      </h2>
      <p className="muted mt-2 max-w-3xl text-base sm:text-lg">{description}</p>
    </div>
  );
}

export function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`panel rounded-[1.75rem] px-5 py-5 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

export function RichText({
  text,
  className = "text-sm text-[var(--muted)]",
}: {
  className?: string;
  text: string;
}) {
  return (
    <div className="space-y-3">
      {text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={`${paragraph.slice(0, 24)}-${index}`} className={className}>
            {paragraph}
          </p>
        ))}
    </div>
  );
}
