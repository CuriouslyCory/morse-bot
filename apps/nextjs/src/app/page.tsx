import { DecoderPanel } from "./_components/decoder-panel";

export default function HomePage() {
  return (
    <main className="container py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">
        Moris Bot — Morse Decoder
      </h1>
      <DecoderPanel />
    </main>
  );
}
