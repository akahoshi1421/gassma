import { GassmaClient } from "./app/gassma";
import { z } from "./app/zod";

declare const global: {
  [x: string]: unknown;
};

global.GassmaClient = GassmaClient;
global.z = z;
