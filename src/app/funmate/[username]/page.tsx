import { notFound } from "next/navigation";
import type { Metadata } from "next";
import FunmateDetailClient from "@/components/funmate/FunmateDetailClient";
import FunmatePageChrome from "@/components/funmate/FunmatePageChrome";
import { getFunmateByUsername } from "@/lib/funmate";
import { capitalize } from "@/lib/capitalize";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  // Reuses the same cached fetch the page component makes below, so this
  // doesn't cost a second request to the backend.
  const result = await getFunmateByUsername(username);

  if (result.status !== "found") {
    return { title: "Profile not found" };
  }

  const { funmate } = result;
  const location = [funmate.lga, funmate.state].filter(Boolean).join(", ");
  const title = `${capitalize(username)}${funmate.age ? `, ${funmate.age}` : ""}`;
  const description = [
    funmate.vibeBio,
    location && `📍 ${location}`,
    "See more on Bluufun.",
  ]
    .filter(Boolean)
    .join(" — ");
  const image = funmate.mediaUrls?.[0];

  return {
    title,
    description,
    openGraph: {
      title: `${title} on Bluufun`,
      description,
      url: `/funmate/${username}`,
      type: "profile",
      images: image ? [{ url: image, width: 1080, height: 1350 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} on Bluufun`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function FunmatePage({ params }: PageProps) {
  const { username } = await params;
  const result = await getFunmateByUsername(username);

  if (result.status === "not-found") {
    notFound();
  }

  return (
    <FunmatePageChrome>
      <FunmateDetailClient
        username={username}
        initialFunmate={result.status === "found" ? result.funmate : null}
      />
    </FunmatePageChrome>
  );
}
