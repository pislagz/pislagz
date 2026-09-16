"use client";

import { useEffect, useState } from "react";
import {
  isArcadeAudioRunning,
  subscribeArcadeAudioState,
} from "@shared/arcade-audio";

export function useArcadeAudioUnlocked() {
  const [unlocked, setUnlocked] = useState(isArcadeAudioRunning);

  useEffect(() => subscribeArcadeAudioState(setUnlocked), []);

  return unlocked;
}
