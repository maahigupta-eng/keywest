export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  try {
    const { passkey } = JSON.parse(event.body || "{}");
    const stored = (process.env.GUEST_PASSKEY || "keywest2025").trim().toLowerCase();
    const entered = (passkey || "").trim().toLowerCase();
    if (!entered || entered !== stored) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid passkey" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error: " + err.message }) };
  }
};
