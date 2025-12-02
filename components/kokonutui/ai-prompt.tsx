"use client";

/**
 * @author: @kokonutui
 * @description: AI Prompt Input
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { ArrowRight, Paperclip } from "lucide-react";
import { useState } from "react";
import Anthropic from "@/components/kokonutui/anthropic";
import AnthropicDark from "@/components/kokonutui/anthropic-dark";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";

interface AI_PromptProps {
	onSendMessage?: (message: string) => void;
	disabled?: boolean;
}

export default function AI_Prompt({ onSendMessage, disabled = false }: AI_PromptProps) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });

  const handleSendMessage = () => {
    const trimmedMessage = value.trim();
    if (trimmedMessage && onSendMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setValue("");
      adjustHeight(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-black/5 p-1.5 pt-4 dark:bg-white/5">
        {/* Banner */}
        <div className="mx-2 mb-2.5 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2">
            <Anthropic className="h-3.5 w-3.5 text-black dark:hidden" />
            <AnthropicDark className="hidden h-3.5 w-3.5 dark:block" />
            <h3 className="text-black text-xs tracking-tighter dark:text-white/90">
              in Production
            </h3>
          </div>
          <p className="text-black text-xs tracking-tighter dark:text-white/90">
            coming soon
          </p>
        </div>

        {/* Input Area */}
        <div className="relative">
          <div className="relative flex flex-col">
            <Textarea
              className={cn(
                "w-full resize-none rounded-xl border-none bg-black/5 px-4 py-3 pr-24 placeholder:text-black/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white/5 dark:text-white dark:placeholder:text-white/70",
                "min-h-[72px]"
              )}
              id="ai-input-15"
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder={"Ask about telemetry, strategy, or tire data..."}
              ref={textareaRef}
              value={value}
            />

            {/* Action Buttons - Positioned absolutely on the right */}
            <div className="absolute right-3 top-3 flex items-center gap-2">
              <label
                aria-label="Attach file"
                className={cn(
                  "cursor-pointer rounded-lg bg-black/5 p-2 dark:bg-white/5",
                  "hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:hover:bg-white/10",
                  "text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                )}
              >
                <input className="hidden" type="file" />
                <Paperclip className="h-4 w-4 transition-colors" />
              </label>

              <button
                aria-label="Send message"
                className={cn(
                  "rounded-lg bg-black/5 p-2 dark:bg-white/5",
                  "hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:hover:bg-white/10",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={!value.trim() || disabled}
                onClick={handleSendMessage}
                type="button"
              >
                <ArrowRight
                  className={cn(
                    "h-4 w-4 transition-opacity duration-200 dark:text-white",
                    value.trim() ? "opacity-100" : "opacity-30"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
