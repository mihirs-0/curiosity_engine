import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface AssistantSuggestionBubbleProps {
  json: {
    suggestion: string;
    day?: number;
    tags?: string[];
  };
  onAdd: () => void;
  alreadyAdded?: boolean;
}

export function AssistantSuggestionBubble({
  json,
  onAdd,
  alreadyAdded,
}: AssistantSuggestionBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="flex items-start max-w-[80%] gap-2">
        <div className="bg-white bg-opacity-90 rounded p-3 shadow text-gray-800 w-full">
          <p className="text-sm mb-2">{json.suggestion}</p>
          {json.day !== undefined && (
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded mr-2">
              Day {json.day}
            </span>
          )}
          {json.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded mr-1"
            >
              {tag}
            </span>
          ))}
          <Button
            size="sm"
            variant={alreadyAdded ? "secondary" : "default"}
            className={`ml-2 mt-2 ${
              alreadyAdded
                ? "bg-green-100 text-green-800 cursor-default"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
            onClick={onAdd}
            disabled={alreadyAdded}
          >
            {alreadyAdded ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Added
              </>
            ) : (
              "✓ Add to Trip"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}