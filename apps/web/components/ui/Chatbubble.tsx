import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  avatar?: string;
  name?: string;
}

export function ChatBubble({
  role,
  text,
  timestamp,
  avatar,
  name,
}: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex items-start max-w-[80%] gap-2">
        {!isUser && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatar || "/placeholder.svg"} alt={name || "AI"} />
            <AvatarFallback>{name?.charAt(0).toUpperCase() || "A"}</AvatarFallback>
          </Avatar>
        )}
        <div
          className={`rounded-lg p-3 ${
            isUser ? "bg-amber-500 text-white" : "bg-blue-100 text-blue-800"
          }`}
        >
          <p>{text}</p>
          <p className="text-xs opacity-70 mt-1">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        {isUser && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatar || "/placeholder.svg"} alt={name || "You"} />
            <AvatarFallback>{name?.charAt(0).toUpperCase() || "Y"}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}