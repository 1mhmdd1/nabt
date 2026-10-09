import assert from "node:assert/strict";
import { classify, normalize } from "./moderation.ts";

assert.equal(normalize("أَنا"), "انا");
assert.equal(normalize("3a"), "عa");
assert.equal(normalize("sooooo"), "soo");
assert.equal(classify("Anyone else stuck on Signals ch. 7?").severity, "ok");
assert.equal(classify("I want to die").severity, "high");
assert.equal(classify("I want to die").category, "self-harm");
assert.equal(classify("بدي موت").severity, "high");
assert.equal(classify("you are an idiot").severity, "caution");
assert.equal(classify("").severity, "ok");

console.log("moderation tests passed");
