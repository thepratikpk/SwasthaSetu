import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Camera, MessageCircle } from "lucide-react";
import { useAppState } from "@/context/app-state";

type ChatMessage = {
  role: "user" | "bot";
  text?: string;
  image?: string;
  ts: number;
};

export const ChatWidget: React.FC<{ mode?: "floating" | "panel" }> = ({
  mode = "floating",
}) => {
  const isFloating = mode === "floating";
  const [open, setOpen] = useState<boolean>(() => {
    if (!isFloating) return true;
    try {
      return localStorage.getItem("app:chatOpen") === "1";
    } catch {
      return false;
    }
  });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi! I'm your Ayurvedic assistant. Tell me what you ate or ask for tips.",
      ts: Date.now() - 60000,
    },
    {
      role: "user",
      text: "Any quick tip for digestion?",
      ts: Date.now() - 45000,
    },
    {
      role: "bot",
      text: "Favor warm, cooked meals. Sip ginger-cumin tea after meals.",
      ts: Date.now() - 42000,
    },
  ]);
  const { markMealTaken, updateWater } = useAppState();
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (!isFloating) return { x: 24, y: 24 };
    try {
      const x = parseInt(localStorage.getItem("app:chat:x") || "");
      const y = parseInt(localStorage.getItem("app:chat:y") || "");
      if (!Number.isNaN(x) && !Number.isNaN(y)) return { x, y };
    } catch {}
    return { x: 24, y: 24 };
  });

  // Camera state
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!isFloating) return;
    try {
      localStorage.setItem("app:chatOpen", open ? "1" : "0");
    } catch {}
  }, [open, isFloating]);

  useEffect(() => {
    if (!isFloating || !open) return;
    if (pos.x === 24 && pos.y === 24 && typeof window !== "undefined") {
      const w = 416; // ~w-96
      const h = 560;
      setPos({
        x: Math.max(8, window.innerWidth - w - 16),
        y: Math.max(8, window.innerHeight - h - 16),
      });
    }
  }, [open, isFloating]);

  useEffect(() => {
    if (!isFloating) return;
    try {
      localStorage.setItem("app:chat:x", String(pos.x));
      localStorage.setItem("app:chat:y", String(pos.y));
    } catch {}
  }, [pos, isFloating]);

  const onMouseDownHeader = (e: React.MouseEvent) => {
    if (!open || !isFloating) return;
    draggingRef.current = true;
    offsetRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      const cw = rect?.width || 416;
      const ch = rect?.height || 560;
      const nx = Math.min(
        Math.max(0, ev.clientX - offsetRef.current.dx),
        window.innerWidth - cw,
      );
      const ny = Math.min(
        Math.max(0, ev.clientY - offsetRef.current.dy),
        window.innerHeight - ch,
      );
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (err) {
      setMessages((m) =>
        m.concat({
          role: "bot",
          text: "Camera access denied. You can still upload an image.",
          ts: Date.now(),
        }),
      );
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setMessages((m) =>
      m.concat({ role: "user", image: dataUrl, ts: Date.now() }),
    );
    setTimeout(
      () =>
        setMessages((m) =>
          m.concat({
            role: "bot",
            text: "Got it! I detect whole grains and fresh produce. Want a quick calorie estimate?",
            ts: Date.now(),
          }),
        ),
      500,
    );
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text, ts: Date.now() }]);
    setInput("");

    const t = text.toLowerCase();
    let reply = "Noted. How else can I help?";
    if (t.includes("water")) {
      updateWater(250);
      reply = "Logged 250ml water. Keep hydrating!";
    }
    if (
      t.includes("ate my lunch") ||
      t.includes("lunch done") ||
      t.includes("meal done")
    ) {
      markMealTaken();
      reply =
        "Great! I marked your lunch as taken. Want a light herbal tea later?";
    }
    if (t.includes("tip") || t.includes("advice")) {
      reply =
        "Choose warm, cooked meals. Avoid iced drinks. Ginger and cumin can aid digestion.";
    }

    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: reply, ts: Date.now() }]);
    }, 400);
  };

  const Header = (
    <div
      className={cn(
        "flex items-center justify-between border-b px-3 py-2",
        isFloating && "cursor-move",
      )}
      onMouseDown={onMouseDownHeader}
    >
      <div className="text-sm font-semibold">Ayur Assistant</div>
      {isFloating && (
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      )}
    </div>
  );

  const Body = (
    <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm bg-gray-50/60">
      {messages.map((m, i) => (
        <div
          key={i}
          className={cn(
            "flex",
            m.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          <div className="max-w-[80%]">
            {m.image ? (
              <img
                src={m.image}
                alt="captured"
                className={cn(
                  "rounded-md",
                  m.role === "user" ? "border-2 border-primary" : "border",
                )}
              />
            ) : (
              <div
                className={cn(
                  "rounded-md px-3 py-2",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {m.text}
              </div>
            )}
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {new Date(m.ts).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );

  const Composer = (
    <div className="border-t p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInput("I drank water")}
        >
          +250ml Water
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInput("I ate my lunch")}
        >
          I ate lunch
        </Button>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = String(reader.result || "");
                setMessages((m) =>
                  m.concat({ role: "user", image: dataUrl, ts: Date.now() }),
                );
                setTimeout(
                  () =>
                    setMessages((m) =>
                      m.concat({
                        role: "bot",
                        text: "Looks good! I can scan barcodes or estimate ingredients from photos.",
                        ts: Date.now(),
                      }),
                    ),
                  500,
                );
              };
              reader.readAsDataURL(file);
            }}
          />
          <span className="rounded-md border px-2 py-1">Upload</span>
        </label>
      </div>

      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message... e.g., I drank water"
          className="mb-2 h-20 pr-24"
        />
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2">
          <div className="pointer-events-auto">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => (cameraOn ? stopCamera() : startCamera())}
              className={cn(cameraOn && "bg-accent text-accent-foreground")}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {cameraOn && (
        <div className="mb-2 rounded-md border p-2">
          <video
            ref={videoRef}
            className="h-40 w-full rounded-md bg-black/20 object-contain"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={capturePhoto}>
              Capture
            </Button>
          </div>
        </div>
      )}

      <Button className="w-full" onClick={handleSend}>
        Send
      </Button>
    </div>
  );

  if (!isFloating) {
    return (
      <Card className="w-full h-svh flex flex-col rounded-none border-0 bg-white/80 backdrop-blur-sm">
        {Header}
        {Body}
        {Composer}
      </Card>
    );
  }

  return (
    <div className={cn("fixed z-40 flex flex-col items-end gap-3")}>
      {open && (
        <div
          ref={containerRef}
          style={{ left: pos.x, top: pos.y, position: "fixed" }}
        >
          <Card className="w-96 shadow-xl border-[#0FA36B]/50">
            {Header}
            {Body}
            {Composer}
          </Card>
        </div>
      )}
      {!open && (
        <Button
          size="lg"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
        >
          <MessageCircle />
        </Button>
      )}
    </div>
  );
};
