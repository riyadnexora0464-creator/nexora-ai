
const MAX_BODY_BYTES = 24 * 1024;
const MAX_MESSAGES = 13; // One system message + up to 12 chat messages
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_CHARS = 16000;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function errorResponse(message, status) {
  return jsonResponse(
    {
      error: message,
      message: {
        content: message
      }
    },
    status
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only handle the AI chat endpoint.
    if (url.pathname !== "/api/chat") {
      return new Response("Not found", { status: 404 });
    }

    // The chat endpoint accepts POST requests only.
    if (request.method !== "POST") {
      return errorResponse("This endpoint only accepts POST requests.", 405);
    }

    // Reject oversized requests before reading their body.
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > MAX_BODY_BYTES) {
      return errorResponse("Your message is too large. Please shorten it.", 413);
    }

    let rawBody;

    try {
      rawBody = await request.arrayBuffer();
    } catch {
      return errorResponse("The request could not be read.", 400);
    }

    if (rawBody.byteLength > MAX_BODY_BYTES) {
      return errorResponse("Your message is too large. Please shorten it.", 413);
    }

    let body;

    try {
      const text = new TextDecoder().decode(rawBody);
      body = JSON.parse(text);
    } catch {
      return errorResponse("The request contains invalid JSON.", 400);
    }

    // Validate the messages array.
    if (
      !body ||
      typeof body !== "object" ||
      !Array.isArray(body.messages)
    ) {
      return errorResponse("A valid messages array is required.", 400);
    }

    const messages = body.messages;

    if (messages.length === 0 || messages.length > MAX_MESSAGES) {
      return errorResponse(
        "The conversation contains too many messages. Please start a new chat.",
        400
      );
    }

    let totalChars = 0;

    for (const message of messages) {
      if (
        !message ||
        typeof message !== "object" ||
        !["system", "user", "assistant"].includes(message.role) ||
        typeof message.content !== "string"
      ) {
        return errorResponse("One or more chat messages are invalid.", 400);
      }

      const content = message.content.trim();

      if (content.length === 0) {
        return errorResponse("Empty messages are not allowed.", 400);
      }

      if (content.length > MAX_MESSAGE_CHARS) {
        return errorResponse(
          "A message is too long. Please keep each message under 4,000 characters.",
          400
        );
      }

      totalChars += content.length;
    }

    if (totalChars > MAX_TOTAL_CHARS) {
      return errorResponse(
        "This conversation is too long. Please start a new chat.",
        400
      );
    }

    if (!messages.some((message) => message.role === "user")) {
      return errorResponse("Please send a user message.", 400);
    }

    if (messages[messages.length - 1].role !== "user") {
      return errorResponse("Your latest message must be a user message.", 400);
    }

    // Apply the visitor's rate limit before calling Workers AI.
    const visitorIP = request.headers.get("cf-connecting-ip") || "unknown";

    let rateLimitResult;

    try {
      rateLimitResult = await env.AI_CHAT_LIMITER.limit({
        key: visitorIP
      });
    } catch (error) {
      console.error("Rate limiter error:", error);

      return errorResponse(
        "The AI service is temporarily unavailable. Please try again shortly.",
        503
      );
    }

    if (!rateLimitResult.success) {
      return errorResponse(
        "You've reached the chat limit. Please wait one minute before sending another message.",
        429
      );
    }

    // Send validated messages to Cloudflare Workers AI.
    try {
      const result = await env.AI.run(
        "@cf/meta/llama-3.2-3b-instruct",
        {
          messages,
          max_tokens: 512
        }
      );

      if (!result || typeof result.response !== "string") {
        throw new Error("The AI returned an unexpected response.");
      }

      return jsonResponse({
        message: {
          content: result.response
        }
      });
    } catch (error) {
      console.error("Workers AI error:", error);

      return errorResponse(
        "Nexora AI couldn't complete your request. Please try again.",
        500
      );
    }
  }
};
