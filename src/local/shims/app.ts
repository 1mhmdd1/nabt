const apps: { name: string; options: unknown }[] = [];

export function initializeApp(config: unknown) {
  const app = { name: "[DEFAULT]", options: config };
  apps.push(app);
  return app;
}

export function getApps() {
  return apps;
}
