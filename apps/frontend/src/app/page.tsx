import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="container flex max-w-5xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Master Your Typing Speed with{' '}
          <span className="text-primary">TypeMaster</span>
        </h1>
        
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Practice typing, track your WPM, and improve your accuracy with our
          modern typing test platform. Real-time analytics and progress tracking
          to help you become a faster typist.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/test">
            <Button size="lg" className="w-full sm:w-auto">
              Start Typing Test
            </Button>
          </Link>
          
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6">
            <div className="text-3xl font-bold text-primary">30s - 3min</div>
            <p className="text-sm text-muted-foreground">Test Durations</p>
          </div>
          
          <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6">
            <div className="text-3xl font-bold text-primary">Real-time</div>
            <p className="text-sm text-muted-foreground">WPM Tracking</p>
          </div>
          
          <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6">
            <div className="text-3xl font-bold text-primary">Analytics</div>
            <p className="text-sm text-muted-foreground">Progress Insights</p>
          </div>
        </div>
      </div>
    </main>
  );
}
