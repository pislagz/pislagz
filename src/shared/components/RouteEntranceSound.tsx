"use client";

import { useEffect } from "react";
import {
  playRouteEntranceSound,
  type RouteEntranceSoundId,
} from "@shared/route-entrance-sound";

type Props = {
  route: RouteEntranceSoundId;
};

export function RouteEntranceSound({ route }: Props) {
  useEffect(() => {
    const cancel = playRouteEntranceSound(route);
    return cancel;
  }, [route]);

  return null;
}
