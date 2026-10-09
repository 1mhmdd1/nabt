import assert from "node:assert/strict";
import { test } from "node:test";
import { reviewOutgoing } from "./outgoing.ts";

const anon = "anon-id-ok";

test("plain text sends with no kindness flag", () => {
  const review = reviewOutgoing("Ten minutes, then a page.", "circle", anon);
  assert.equal(review.action, "send");
  if (review.action === "send") assert.equal(review.kindness, false);
});

test("stuck lines send and raise the kindness flag in EN FR AR Arabizi", () => {
  for (const line of ["I'm stuck on chapter two", "can't start", "I don't get this", "so tired", "je suis bloqué", "ما عم فهم", "ta3ban kteer"]) {
    const review = reviewOutgoing(line, "circle", anon);
    assert.equal(review.action, "send", line);
    if (review.action === "send") assert.equal(review.kindness, true, line);
  }
});

test("harassment, threats and kys are blocked and stay editable", () => {
  for (const line of ["I hate you", "shut up", "you are an idiot", "kys"]) {
    const review = reviewOutgoing(line, "circle", anon);
    assert.equal(review.action, "block", line);
    if (review.action === "block") assert.match(review.reason, /Edit/);
  }
});

test("phone numbers, links and handles are blocked", () => {
  const phone = reviewOutgoing("text me 03 123 456", "buddy", anon);
  const link = reviewOutgoing("look at https://example.com/x", "thread", anon);
  const handle = reviewOutgoing("ask @maya please", "alumni", anon);
  assert.equal(phone.action, "block");
  assert.equal(link.action, "block");
  assert.equal(handle.action, "block");
});

test("distress opens support and is not a kindness send", () => {
  const review = reviewOutgoing("I want to kill myself", "circle", anon);
  assert.equal(review.action, "support");
  if (review.action === "support") {
    assert.equal(review.signal?.category, "self-harm");
    assert.equal("kindness" in review, false);
  }
  const hopeless = reviewOutgoing("nothing i do is enough", "circle", anon);
  assert.equal(hopeless.action, "support");
});
