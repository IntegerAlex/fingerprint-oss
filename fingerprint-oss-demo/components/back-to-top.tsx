"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackToTopProps {
  className?: string;
}

export default function BackToTop({ className }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    // Cleanup
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      variant="default"
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all duration-300 ease-in-out",
        "hover:scale-110 focus:scale-110 active:scale-95",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "border-2 border-primary/20 hover:border-primary/40",
        "backdrop-blur-sm bg-primary/95",
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none",
        className
      )}
      aria-label="Back to top"
      title="Back to top"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  );
}
