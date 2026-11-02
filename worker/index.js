
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();

        if (!Array.isArray(body.messages)) {
          return Response.json(
            { error: "A messages array is required." },
            { status: 400 }
          );
        }

        const messages = body.messages
          .filter(
            (message) =>
              ["system", "user", "assistant"].includes(message.role) &&
              typeof message.content === "string"
          )
          .slice(-12);

        if (!messages.some((message) => message.role === "user")) {
          return Response.json(
            { error: "Please send a user message." },
            { status: 400 }
          );
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.2-3b-instruct",
          {
            messages,
            max_tokens: 512
          }
        );

        return Response.json({
          message: {
            content: result.response
          }
        });
      } catch (error) {
        console.error("Workers AI error:", error);

        return Response.json(
          { error: "The AI service could not complete your request." },
          { status: 500 }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
