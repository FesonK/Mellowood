import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AIProvider, ChatMessage, GoalSummary } from '@/ai/types';
import { Button, cn, Mascot } from '@/ui';

export interface GoalChatProps {
  ai: AIProvider;
  initialGoal?: string;
  initialMessages?: ChatMessage[];
  onSummary: (summary: GoalSummary, messages: ChatMessage[]) => void;
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export function GoalChat({ ai, initialGoal, initialMessages = [], onSummary, onMessagesChange }: GoalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = async (history: ChatMessage[]) => {
    setMessages(history);
    onMessagesChange?.(history);
    setThinking(true);
    setError(null);
    try {
      const result = await ai.clarifyGoal(history);
      const reply: ChatMessage = {
        role: 'assistant',
        content: result.kind === 'question' ? result.question : result.message,
      };
      const next = [...history, reply];
      setMessages(next);
      onMessagesChange?.(next);
      if (result.kind === 'summary') {
        setDone(true);
        onSummary(result.summary, next);
      }
    } catch {
      setError('Mellow got a little tangled. Try sending that again?');
    } finally {
      setThinking(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const last = initialMessages[initialMessages.length - 1];
    if (initialMessages.length === 0 && initialGoal?.trim()) {
      void ask([{ role: 'user', content: initialGoal.trim() }]);
    } else if (last?.role === 'user') {
      void ask(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages, thinking]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setDraft('');
    void ask([...messages, { role: 'user', content: text }]);
  };

  return (
    <div className="flex flex-col gap-4">
      <ol aria-label="Conversation with Mellow" className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className={cn('flex items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {m.role === 'assistant' && <Mascot size={36} float={false} mood="happy" className="shrink-0" />}
              <p
                className={cn(
                  'max-w-[80%] whitespace-pre-wrap rounded-3xl px-4 py-3 leading-relaxed shadow-soft',
                  m.role === 'user'
                    ? 'rounded-br-md bg-gradient-to-br from-berry to-peach text-white'
                    : 'glass rounded-bl-md text-ink',
                )}
              >
                {m.content}
              </p>
            </motion.li>
          ))}
        </AnimatePresence>
        {thinking && (
          <li className="flex items-end gap-2">
            <Mascot size={36} float={false} mood="thinking" className="shrink-0" />
            <span role="status" aria-label="Mellow is typing" className="glass flex gap-1.5 rounded-3xl rounded-bl-md px-4 py-4">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-2 w-2 animate-bounce rounded-full bg-lavender"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </span>
          </li>
        )}
      </ol>
      <div ref={endRef} />

      {error && (
        <p role="alert" className="rounded-squish bg-blush/40 px-4 py-2 text-sm font-semibold">
          {error}
        </p>
      )}

      {!done && (
        <form onSubmit={send} className="glass sticky bottom-4 flex items-center gap-2 rounded-full p-2 shadow-soft">
          <label htmlFor="goal-answer" className="sr-only">
            Your answer
          </label>
          <input
            id="goal-answer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your answer…"
            autoComplete="off"
            className="h-11 flex-1 bg-transparent px-4 text-ink placeholder:text-ink-soft/60 focus:outline-none"
          />
          <Button type="submit" disabled={!draft.trim() || thinking} aria-label="Send">
            Send
          </Button>
        </form>
      )}
    </div>
  );
}
