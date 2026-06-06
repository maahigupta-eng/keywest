export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  try {
    const { passkey } = JSON.parse(event.body || "{}");
    const guestPasskey = (process.env.GUEST_PASSKEY || "keywest2025").toLowerCase();
    if (!passkey || passkey.toLowerCase() !== guestPasskey) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid passkey" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error" }) };
  }
};
