import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AIAssistant = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateColors = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description!");
      return;
    }

    setIsLoading(true);
    // OpenAI integration will be added later
    setTimeout(() => {
      setIsLoading(false);
      toast.info("AI assistant will be available soon!");
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">AI Color Assistant</h2>
      <p className="text-white/60 mb-4">
        Describe what you need, and we'll suggest a color palette for you.
      </p>
      <div className="space-y-4">
        <Textarea
          placeholder="Example: I'm looking for a color palette for a modern and minimalist website..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] bg-white/5 border-white/10 text-white"
        />
        <Button
          onClick={generateColors}
          className="w-full bg-white text-black hover:bg-white/90"
          disabled={isLoading}
        >
          {isLoading ? "Generating Color Palette..." : "Generate Color Palette"}
        </Button>
      </div>
    </div>
  );
};

export default AIAssistant;
