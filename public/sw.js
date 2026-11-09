/* Service worker LoomraPOS: hanya menangani push notification. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "LoomraPOS", body: "", url: "/superadmin/billing" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    /* isi bukan JSON: pakai teks bawaan */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: data.tag,
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          try {
            client.navigate(url);
          } catch (e) {
            /* abaikan */
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
