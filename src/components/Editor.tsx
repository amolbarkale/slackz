import "quill/dist/quill.snow.css";

import { ImageIcon, Smile, XIcon, Bot } from "lucide-react";
import Quill, { QuillOptions } from "quill";
import { Delta, Op } from "quill/core";
import {
  MutableRefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MdSend } from "react-icons/md";
import { PiTextAa } from "react-icons/pi";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { EmojiPopover } from "./EmojiPopover";
import { Hint } from "./Hint";
import { Button } from "./ui/button";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

type EditorValue = {
  image: File | null;
  body: string;
};

interface EditorProps {
  variant?: "create" | "update";
  defaultValue?: Delta | Op[];
  disabled?: boolean;
  innerRef?: MutableRefObject<Quill | null>;
  placeholder?: string;
  onCancel?: () => void;
  onSubmit: ({ image, body }: EditorValue) => void;
  onSuggestReply?: () => Promise<string[]>;
  showSuggestReply?: boolean;
}

function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const Editor = ({
  variant = "create",
  defaultValue = [],
  disabled = false,
  innerRef,
  placeholder = "Write something...",
  onCancel,
  onSubmit,
  onSuggestReply,
  showSuggestReply = false,
}: EditorProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [tone, setTone] = useState<string | null>(null);
  const [loadingTone, setLoadingTone] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const toneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isEmpty = useMemo(
    () => !image && text.replace("/s*/g", "").trim().length === 0,
    [text, image]
  );
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const onSubmitRef = useRef(onSubmit);
  const placeholderRef = useRef(placeholder);
  const quillRef = useRef<Quill | null>(null);
  const defaultValueRef = useRef(defaultValue);
  const disabledRef = useRef(disabled);
  const imageElementRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    onSubmitRef.current = onSubmit;
    placeholderRef.current = placeholder;
    defaultValueRef.current = defaultValue;
    disabledRef.current = disabled;
  });

  // TODO: need to uncomment it once we done with testing of auto suggestion.
  useEffect(() => {
    if (toneTimeoutRef.current) {
      clearTimeout(toneTimeoutRef.current);
    }

    if (text.trim().length === 0) {
      setTone(null);
      return;
    }

    toneTimeoutRef.current = setTimeout(async () => {
      setLoadingTone(true);
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

        const systemPrompt = `
            You are a Tone & Impact Analyzer. 
            Given the user's draft message, classify its tone as one of: "aggressive", "weak", "confusing", "neutral", or "friendly".
            Then classify its impact as one of: "low-impact", "medium-impact", or "high-impact".
            Return ONLY this JSON:
            { "tone": "<tone>", "impact": "<impact>" }
                    `.trim();

        const userPrompt = `Message: """${text.trim()}"""`;

        const prompt = `${systemPrompt}\n\n${userPrompt}`

        const result = await model.generateContent(prompt);

        let raw = result.response.text();
        raw = raw.replace(/```json\s*/, "").replace(/```/g, "").trim();
        console.log('raw:', raw)

        let parsed: { tone: string; impact: string } | null = null;
        try {
          parsed = JSON.parse(raw);
          console.log('parsed:', parsed)
        } catch {
          console.warn("Tone analysis returned invalid JSON:", raw);
        }

        if (parsed && parsed.tone && parsed.impact) {
          setTone(`${capitalizeFirst(parsed.tone)}, ${capitalizeFirst(parsed.impact)}`);
        } else {
          setTone(null);
        }
      } catch (err) {
        console.error("Error fetching tone analysis:", err);
        setTone(null);
      } finally {
        setLoadingTone(false);
      }
    }, 500);

    return () => {
      if (toneTimeoutRef.current) {
        clearTimeout(toneTimeoutRef.current);
      }
    };
  }, [text]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const editorContainer = container.appendChild(
      container.ownerDocument.createElement("div")
    );

    const options: QuillOptions = {
      theme: "snow",
      placeholder: placeholderRef.current,
      modules: {
        toolbar: [
          ["bold", "italic", "strike"],
          ["link"],
          [
            {
              list: "ordered",
            },
            {
              list: "bullet",
            },
          ],
        ],
        keyboard: {
          bindings: {
            enter: {
              key: "Enter",
              handler: () => {
                const text = quill.getText();
                const addedImage = imageElementRef.current?.files?.[0] || null;
                const isEmpty =
                  !addedImage && text.replace("/s*/g", "").trim().length === 0;

                if (isEmpty) return;

                const body = JSON.stringify(quill.getContents());
                
                onSubmitRef.current?.({ body, image: addedImage });
              },
            },
            shift_enter: {
              key: "Enter",
              shiftKey: true,
              handler: () => {
                quill.insertText(quill.getSelection()?.index || 0, "\n");
              },
            },
          },
        },
      },
    };

    const quill = new Quill(editorContainer, options);
    quillRef.current = quill;
    quillRef.current.focus();

    if (innerRef) {
      innerRef.current = quill;
    }

    quill.setContents(defaultValueRef.current);
    setText(quill.getText());

    quill.on(Quill.events.TEXT_CHANGE, () => {
      setText(quill.getText());
    });

    return () => {
      quill.off(Quill.events.TEXT_CHANGE);
      if (container) {
        container.innerHTML = "";
      }
      if (quillRef.current) {
        quillRef.current = null;
      }
      if (innerRef) {
        innerRef.current = null;
      }
    };
  }, [innerRef]);

  const handleToolbarToggle = () => {
    setIsToolbarVisible((current) => !current);
    const toolbarElement = containerRef.current?.querySelector(".ql-toolbar");
    if (toolbarElement) {
      toolbarElement.classList.toggle("hidden");
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const quill = quillRef.current;

    quill?.insertText(quill?.getSelection()?.index || 0, emoji);
  };

  const handleSuggestReply = async () => {
    if (!onSuggestReply) return;
    
    setLoadingSuggestion(true);
    try {
      const suggestions = await onSuggestReply();
      setSuggestions(suggestions || []);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    const quill = quillRef.current;
    if (!quill) return;

    // Clear current content and insert suggestion
    quill.setContents([]);
    quill.insertText(0, suggestion);
    setText(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="flex flex-col">
      <input
        type="file"
        accept="image/*"
        ref={imageElementRef}
        onChange={(event) => setImage(event.target.files![0])}
        className="hidden"
      />
      
      {/* AI Suggestions Panel */}
      {suggestions.length > 0 && (
        <div className="mb-3 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="size-4 text-[#007a5a]" />
            <span className="text-sm font-semibold text-slate-800">AI Reply Suggestions</span>
            <button
              onClick={() => setSuggestions([])}
              className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XIcon className="size-4" />
            </button>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => insertSuggestion(suggestion)}
                className="w-full text-left p-3 text-sm bg-white border border-slate-200 rounded-md hover:border-[#007a5a] hover:bg-[#007a5a]/5 transition-all duration-200 group"
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-[#007a5a]/10 text-[#007a5a] rounded-full flex items-center justify-center text-xs font-medium group-hover:bg-[#007a5a] group-hover:text-white transition-colors">
                    {index + 1}
                  </span>
                  <span className="text-slate-700 group-hover:text-slate-900 leading-relaxed">
                    {suggestion}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500 text-center">
            Click on a suggestion to insert it into your message
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col border border-slate-200 rounded-md overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition bg-white",
          disabled && "opacity-50"
        )}
      >
        <div ref={containerRef} className="h-full ql-custom"></div>
        {!!image && (
          <div className="p-2">
            <div className="relative size-[62px] flex items-center justify-center group/image">
              <Hint label="Remove image">
                <button
                  onClick={() => {
                    setImage(null);
                    imageElementRef.current!.value = "";
                  }}
                  className="hidden group-hover/image:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[4] border-2 border-white items-center justify-center"
                >
                  <XIcon className="size-3.5" />
                </button>
              </Hint>
              <Image
                src={URL.createObjectURL(image)}
                alt="Uploaded"
                fill
                className="rounded-xl overflow-hidden object-cover"
              />
            </div>
          </div>
        )}
        <div className="flex px-2 pb-2 z-[5]">
          <Hint
            label={isToolbarVisible ? "Hide formatting" : "Show formatting"}
          >
            <Button
              disabled={disabled}
              size="sm"
              variant="ghost"
              onClick={handleToolbarToggle}
            >
              <PiTextAa className="size-4" />
            </Button>
          </Hint>
          <EmojiPopover onEmojiSelect={handleEmojiSelect}>
            <Button disabled={disabled} size="sm" variant="ghost">
              <Smile className="size-4" />
            </Button>
          </EmojiPopover>
          {variant === "create" && (
            <Hint label="Image">
              <Button
                disabled={disabled}
                size="sm"
                variant="ghost"
                onClick={() => imageElementRef.current?.click()}
              >
                <ImageIcon className="size-4" />
              </Button>
            </Hint>
          )}
          {/* AI Suggest Reply Button */}
          {showSuggestReply && variant === "create" && (
            <Hint label="Get AI reply suggestions">
              <Button
                disabled={disabled || loadingSuggestion}
                size="sm"
                variant="ghost"
                onClick={handleSuggestReply}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Bot className="size-6 mb-1" />
              </Button>
            </Hint>
          )}
          {variant === "update" && (
            <div className="ml-auto flex items-center gap-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={disabled}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onSubmit({
                    body: JSON.stringify(quillRef.current?.getContents()),
                    image,
                  })
                }
                disabled={disabled || isEmpty}
                className="bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
              >
                Save
              </Button>
            </div>
          )}
          {variant === "create" && (
            <Button
              disabled={disabled || isEmpty}
              onClick={() =>
                onSubmit({
                  body: JSON.stringify(quillRef.current?.getContents()),
                  image,
                })
              }
              className={cn(
                "ml-auto",
                isEmpty
                  ? "bg-white hover:bg-white text-muted-foreground"
                  : "bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
              )}
              size="sm"
            >
              <MdSend className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-col items-start px-2">
        {loadingSuggestion && (
          <p className="text-xs text-blue-500 italic">Getting AI suggestions…</p>
        )}
        {loadingTone && (
          <p className="text-xs text-gray-500 italic">Checking tone…</p>
        )}
        {!loadingTone && tone && (
          <p className="text-xs">
            <strong>✨Tone & Impact: </strong> {tone}
          </p>
        )}
      </div>

      {variant === "create" && (
        <div
          className={cn(
            "p-2 text-[10px] text-muted-foreground flex justify-end opacity-0 transition",
            !isEmpty && "opacity-100"
          )}
        >
          <p>
            <strong>Shift + Return</strong> to add new line
          </p>
        </div>
      )}
    </div>
  );
};

export default Editor;
