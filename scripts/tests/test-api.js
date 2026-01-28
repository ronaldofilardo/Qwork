import http from "http";

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/avaliacoes/inativar?avaliacaoId=1",
  method: "GET",
  headers: {
    Cookie: "session=some-session-id",
  },
};

console.log("Testing inactivation API...");

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("Response received");
    try {
      const json = JSON.parse(data);
      console.log("Success:", JSON.stringify(json, null, 2));
    } catch (e) {
      console.log("Raw response:", data.substring(0, 500));
    }
  });
});

req.on("error", (e) => {
  console.error("Request failed:", e.message);
});

req.setTimeout(10000, () => {
  console.log("Request timeout");
  req.destroy();
});

req.end();
