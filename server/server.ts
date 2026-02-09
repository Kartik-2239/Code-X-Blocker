import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { cors } from "hono/cors";

const app = new Hono();


const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
}));

const clients = new Set<any>();
var isBlocked = false;

app.get("/ws", upgradeWebSocket((c) => {
    return {
        onOpen: (evt, ws) => {
            console.log("WebSocket opened");
            clients.add(ws);
        },
        onMessage: (event, ws) => {
            console.log("got message", event.data);
        },
        onClose: (evt, ws) => {
            console.log("WebSocket closed");
            clients.delete(ws);
        },
        onError: (evt) => {
            console.error("WebSocket error");
        },
    }
}));


app.get("/current-status", (c) => {
    return c.json({ status: isBlocked ? "blocked" : "unblocked" });
});

app.get("/unblock", (c) => {
    isBlocked = false;
    const msg = JSON.stringify({ action: "event", data: "unblock" });
    console.log("Sending:", msg);
    for (const ws of clients) {
        ws.send(msg);
    }
    return c.json({ message: "Unblocked" });
});

app.get("/block", (c) => {
    isBlocked = true;
    const msg = JSON.stringify({ action: "event", data: "block" });
    console.log("Sending:", msg);
    for (const ws of clients) {
        ws.send(msg);
    }
    return c.json({ message: "Blocked" });
});

const server = serve({
    fetch: app.fetch,
    port: 3000,
});

injectWebSocket(server);

console.log("🚀 Server running on http://localhost:3000");
