
import { useEffect, useRef, useState } from "react";
import "./NexoraAssistant.css";

const MODEL = "qwen2.5:3b";

const TEXT = {
  en: {
    title: "NEXORA AI",
    subtitle: "Your personal gaming intelligence",
    online: "ONLINE",
    welcomeTitle: "Welcome to your AI command center",
    welcome:
      "I'm your Nexora AI Coach. Ask me about gaming strategies, improving your skills, or anything you'd like to learn.",
    placeholder: "Message Nexora AI...",
    send: "Send",
    clear: "New chat",
    thinking: "Nexora AI is thinking",
    you: "YOU",
    assistant: "NEXORA AI",
    error:
      "I couldn't connect to Ollama. Check that Ollama is running and the Qwen model is installed.",
    empty: "Please enter a message first.",
    prompt1: "Improve my gaming skills",
    prompt2: "Give me a winning strategy",
    prompt3: "How can I react faster?",
    powered: "POWERED BY QWEN AI",
  },
  zh: {
    title: "NEXORA AI",
    subtitle: "你的专属游戏智能助手",
    online: "在线",
    welcomeTitle: "欢迎来到 AI 指挥中心",
    welcome:
      "你好！我是 Nexora AI 智能教练。你可以向我询问游戏策略、提升游戏技巧，或学习任何你感兴趣的内容。",
    placeholder: "向 Nexora AI 发送消息……",
    send: "发送",
    clear: "新建聊天",
    thinking: "Nexora AI 正在思考",
    you: "你",
    assistant: "NEXORA AI",
    error: "无法连接 Ollama。请确认 Ollama 正在运行，并且已经安装 Qwen 模型。",
    empty: "请先输入消息。",
    prompt1: "提升我的游戏技巧",
    prompt2: "给我一个获胜策略",
    prompt3: "怎样提高反应速度？",
    powered: "由 QWEN AI 提供支持",
  },
};

export default function NexoraAssistant({ language = "en", compact = false }) {
  const isChinese = language === "zh" || language === "zh-CN";
  const t = isChinese ? TEXT.zh : TEXT.en;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(event, suppliedQuestion) {
    event?.preventDefault();

    const question = (suppliedQuestion ?? input).trim();

    if (!question) {
      setError(t.empty);
      return;
    }

    if (loading) return;

    const updatedMessages = [
      ...messages,
      { role: "user", content: question },
    ];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    const systemMessage = {
      role: "system",
      content: isChinese
        ? "你是 Nexora AI 的专业游戏助手。请使用简体中文回答。帮助用户学习游戏策略、提高游戏技巧、理解游戏机制和解决技术问题。回答清晰、友好、准确。不要声称拥有实时游戏数据或无法访问的信息。"
        : "You are Nexora AI, a helpful gaming assistant. Answer in English. Help users learn gaming strategies, improve their skills, understand game mechanics, and solve technical problems. Be clear, friendly, and accurate. Do not pretend to have live game data or access to information you cannot retrieve.",
    };

    try {
      const response = await fetch("/ollama-api/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            systemMessage,
            ...updatedMessages.slice(-12),
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const answer = data?.message?.content?.trim();

      if (!answer) {
        throw new Error("Ollama returned an empty response.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: answer },
      ]);
    } catch (err) {
      console.error("Nexora AI error:", err);
      setError(t.error);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function clearChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <section className={`nexora-ai-panel${compact ? " compact" : ""}`}>
      <header className="nexora-ai-header">
        <div className="nexora-ai-brand">
          <div className="nexora-ai-logo">
            <span>✦</span>
          </div>

          <div className="nexora-ai-heading">
            <div className="nexora-ai-title-row">
              <h3>{t.title}</h3>
              <span className="nexora-ai-online">
                <span className="nexora-ai-status-dot" />
                {t.online}
              </span>
            </div>
            <p>{t.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          className="nexora-ai-clear"
          onClick={clearChat}
          disabled={loading}
        >
          <span>↻</span> {t.clear}
        </button>
      </header>

      <div className="nexora-ai-messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="nexora-ai-welcome">
            <div className="nexora-ai-welcome-glow">
              <div className="nexora-ai-avatar nexora-ai-large-avatar">
                ✦
              </div>
            </div>

            <span className="nexora-ai-welcome-label">
              {t.powered}
            </span>

            <h2>{t.welcomeTitle}</h2>
            <p>{t.welcome}</p>

            <div className="nexora-ai-prompts">
              <button
                type="button"
                onClick={() => sendMessage(null, t.prompt1)}
                disabled={loading}
              >
                <span>◈</span> {t.prompt1}
              </button>

              <button
                type="button"
                onClick={() => sendMessage(null, t.prompt2)}
                disabled={loading}
              >
                <span>⚡</span> {t.prompt2}
              </button>

              <button
                type="button"
                onClick={() => sendMessage(null, t.prompt3)}
                disabled={loading}
              >
                <span>◎</span> {t.prompt3}
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            className={`nexora-ai-message ${
              message.role === "user" ? "user-message" : "bot-message"
            }`}
            key={`${index}-${message.role}`}
          >
            {message.role === "assistant" && (
              <div className="nexora-ai-avatar">✦</div>
            )}

            <div className="nexora-ai-message-content">
              <span className="nexora-ai-sender">
                {message.role === "user" ? t.you : t.assistant}
              </span>

              <div className="nexora-ai-bubble">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="nexora-ai-thinking" role="status">
            <div className="nexora-ai-avatar">✦</div>
            <div className="nexora-ai-thinking-card">
              <span>{t.thinking}</span>
              <div className="nexora-ai-dots">
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="nexora-ai-error" role="alert">
          <span>!</span>
          {error}
        </div>
      )}

      <form className="nexora-ai-form" onSubmit={sendMessage}>
        <div className="nexora-ai-input-wrap">
          <span className="nexora-ai-input-icon">✦</span>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (error) setError("");
            }}
            placeholder={t.placeholder}
            disabled={loading}
            aria-label={t.placeholder}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t.send}
            title={t.send}
          >
            {loading ? "…" : "➤"}
          </button>
        </div>

        <div className="nexora-ai-footer">
          <span>{t.powered}</span>
          <span>ENTER ↵</span>
        </div>
      </form>
    </section>
  );
}
