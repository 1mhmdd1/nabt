import { register } from "node:module";

register(new URL("./test-stubs.mjs", import.meta.url));
register(new URL("./resolve-ts.mjs", import.meta.url));
