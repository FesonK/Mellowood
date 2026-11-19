import { Button, Card, Mascot } from '@/ui';

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-6 text-center">
      <Mascot mood="cheering" size={140} />
      <h1 className="text-5xl font-bold">Mellowood</h1>
      <Card>
        <p className="mb-4 text-ink-soft">Learn anything, one cozy step at a time.</p>
        <Button>Let&apos;s grow</Button>
      </Card>
    </main>
  );
}
