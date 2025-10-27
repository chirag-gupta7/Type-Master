import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth/getServerSession';
import GamesClient from './GamesClient';

export default async function GamesPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login?callbackUrl=/games');
  }

  return <GamesClient />;
}
