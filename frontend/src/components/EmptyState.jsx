import React from 'react';
import { Sparkles, BookOpen, Image, Compass, Palette, Megaphone, Terminal, Award } from 'lucide-react';

const HOME_PROMPTS = [
  {
    title: "Bedtime Story",
    desc: "A curious squirrel and the glowing moon",
    prompt: "Write a short bedtime story about a curious squirrel and the moon.",
    icon: BookOpen,
  },
  {
    title: "Minimalist Poster",
    desc: "Art concept for a bright living room",
    prompt: "Generate a minimalist poster design for my living room wall featuring natural organic shapes.",
    icon: Palette,
  },
  {
    title: "Cozy Kitchen Moodboard",
    desc: "Inspirations for a cabin kitchen remodel",
    prompt: "Create a detailed moodboard proposal for a cozy cabin kitchen remodel incorporating dark wood and warm lighting.",
    icon: Compass,
  },
  {
    title: "Inspirational Quote",
    desc: "Typography art design ready to frame",
    prompt: "Draft a modern quote poster design for the phrase: 'Small steps every day.' Include styling ideas.",
    icon: Award,
  }
];

const BUSINESS_PROMPTS = [
  {
    title: "Marketing Copy",
    desc: "Ad copy for a specialty coffee roaster",
    prompt: "Write three variations of high-converting social media marketing copywriting for a premium organic coffee brand.",
    icon: Megaphone,
  },
  {
    title: "Product Showcase",
    desc: "Artistic setup for a new smartwatch launch",
    prompt: "Generate a product showcase conceptual outline and image guide for a sleek matte black hybrid smartwatch.",
    icon: Image,
  },
  {
    title: "Startup Branding",
    desc: "Visual guide for an eco-friendly SaaS",
    prompt: "Design a visual identity moodboard concept for an eco-friendly SaaS startup named 'GreenScale'.",
    icon: Compass,
  },
  {
    title: "Marketing Poster",
    desc: "For a summer software conference booth",
    prompt: "Create a modern event poster design outline for a Developer Relations conference booth in San Francisco.",
    icon: Terminal,
  }
];

export default function EmptyState({ currentMode, onSelectPrompt }) {
  const prompts = currentMode === 'Business' ? BUSINESS_PROMPTS : HOME_PROMPTS;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4 text-center mt-8">
      {/* Sparkle Icon Badge */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white mb-6 shadow-xs">
        <Sparkles className="h-6 w-6" />
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
        What would you like to create today?
      </h1>
      <p className="text-neutral-500 text-sm md:text-base max-w-md mb-10 leading-relaxed">
        Choose one of the starter templates below or write your own custom request in {currentMode === 'Business' ? 'Business' : 'Home'} mode.
      </p>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        {prompts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex items-start gap-4 text-left rounded-xl border border-neutral-200 bg-white p-4.5 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-2xs active:bg-neutral-100 transition-all focus:outline-hidden group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-150 text-neutral-500 group-hover:bg-neutral-100 group-hover:text-neutral-900 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-950">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 font-normal leading-normal">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
