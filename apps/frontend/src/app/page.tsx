import { LandingHero } from '@/components/LandingHero';
import { FeatureCards } from '@/components/FeatureCards';

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingHero />
      <FeatureCards />
    </main>
  );
}
