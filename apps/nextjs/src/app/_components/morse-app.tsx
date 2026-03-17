"use client";

import { useState } from "react";

import { DEFAULT_CONFIG } from "@morse-bot/morse-decoder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@morse-bot/ui/tabs";

import { DecoderPanel } from "./decoder-panel";
import { EncoderPanel } from "./encoder-panel";

export function MorseApp() {
  const [frequency, setFrequency] = useState(DEFAULT_CONFIG.targetFrequency);
  const [wpm, setWpm] = useState(DEFAULT_CONFIG.wpm);

  return (
    <Tabs defaultValue="decoder" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="decoder">Decoder</TabsTrigger>
        <TabsTrigger value="encoder">Encoder</TabsTrigger>
      </TabsList>
      <TabsContent value="decoder">
        <DecoderPanel onFrequencyChange={setFrequency} onWpmChange={setWpm} />
      </TabsContent>
      <TabsContent value="encoder">
        <EncoderPanel frequency={frequency} wpm={wpm} />
      </TabsContent>
    </Tabs>
  );
}
