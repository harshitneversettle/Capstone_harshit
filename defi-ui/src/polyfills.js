import { Buffer } from "buffer";
window.Buffer = Buffer;
globalThis.Buffer = Buffer;

import process from "process";
window.process = process;
globalThis.process = process;
