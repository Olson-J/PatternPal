const payload = {
  description: "18th-century fully boned stays with front busk and hand-finished eyelets",
  mode: "professional",
};

const start = Date.now();

try {
  const response = await fetch("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const elapsedMs = Date.now() - start;
  const body = await response.text();

  console.log(`__HTTP_STATUS__=${response.status}`);
  console.log(`__LATENCY_MS__=${elapsedMs}`);
  console.log("__BODY__");
  console.log(body);
} catch (error) {
  const elapsedMs = Date.now() - start;
  const message = error instanceof Error ? error.message : String(error);

  console.log("__HTTP_STATUS__=ERROR");
  console.log(`__LATENCY_MS__=${elapsedMs}`);
  console.log("__ERROR__");
  console.log(message);
}
