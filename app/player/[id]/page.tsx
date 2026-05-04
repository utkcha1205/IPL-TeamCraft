import Link from "next/link";
import { getPlayerById } from "@/data/players";
import PlayerDetailView from "@/components/PlayerDetailView";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const player = getPlayerById(id);

  if (!player) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Player not found</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          The player you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return <PlayerDetailView player={player} />;
}
