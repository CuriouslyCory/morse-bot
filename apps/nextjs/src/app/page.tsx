import { MorseApp } from "./_components/morse-app";

export default function HomePage() {
  return (
    <main className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Morse Code Studio</h1>
        <p className="text-muted-foreground mt-1">
          Decode audio signals or encode text into morse code
        </p>
      </div>
      <MorseApp />
    </main>
  );
}
