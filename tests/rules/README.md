# Firestore Security Rules tests

27 tests (`rules.test.mjs`, `@firebase/rules-unit-testing` + `node:test`) for `docs/firestore.rules`. They cover every role (pending, student, alumni, SA, counselor, admin, signed-out) and each privacy boundary. See `docs/SECURITY_RULES.md` › Tests for the list.

```
cd tests/rules
npm install
npm test        # copies ../../docs/firestore.rules here, starts the Firestore emulator, runs the tests
```

Requirements: Node 20+, Java 11+ (Java 21 recommended for current firebase-tools). The project id `demo-nabt` keeps everything offline.

Last run: 8 Oct 2026, **27/27 passed** (firebase-tools 15.33.0, Temurin JRE 21).
