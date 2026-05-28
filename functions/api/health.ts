export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({ status: "ok", agent: "VickyBot", version: "3.0.0", provider: "groq" }),
    { headers: { "Content-Type": "application/json" } }
  );
};
