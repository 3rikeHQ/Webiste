import http from "node:http";
import handler from "./index.js";

const port = Number(process.env.PORT || 3000);

const server = http.createServer(async (req, res) => {
  const url = `http://localhost:${port}${req.url}`;
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body,
    });
    const out = await handler.fetch(request);
    res.statusCode = out.status;
    for (const [key, value] of out.headers.entries()) {
      res.setHeader(key, value);
    }
    const text = await out.text();
    res.end(text);
  });
});

server.listen(port, () => {
  console.log(`API dev server on http://localhost:${port}`);
});
