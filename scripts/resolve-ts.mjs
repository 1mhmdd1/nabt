/** Lets node:test import extensionless TypeScript the same way Metro does. */
export async function resolve(specifier, context, nextResolve) {
  const relative = specifier.startsWith("./") || specifier.startsWith("../");
  const hasExt = /\.[a-z0-9]+$/i.test(specifier);
  if (relative && !hasExt) {
    for (const suffix of [".ts", ".tsx", "/index.ts"]) {
      try {
        return await nextResolve(specifier + suffix, context);
      } catch {
        /* try the next suffix */
      }
    }
  }
  return nextResolve(specifier, context);
}
