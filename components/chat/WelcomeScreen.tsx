import React from 'react';
import { Icons } from '../Icons';
import { useToast } from './VoiceMode';

interface WelcomeScreenProps {
  onStartTask: (prompt: string, useGoogleSearch?: boolean) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartTask }) => {
  const { showToast } = useToast();
  
  const tasks = [
    { title: 'Generate an Image', icon: 'Sparkles' as keyof typeof Icons, description: 'Turn your ideas into stunning visuals.', isGenerator: true, prompt: '' },
    { title: 'Student Study Helper', icon: 'Book' as keyof typeof Icons, prompt: "Act as my study helper. I'll provide a topic, and you can help me understand it by asking questions and providing explanations.", description: 'Grasp complex topics with a helpful guide.' },
    { title: 'Think Fast', icon: 'Brain' as keyof typeof Icons, prompt: "Let's have a brainstorming session. My topic is...", description: 'Get rapid-fire ideas for any topic.' },
    { title: 'Deep Research', icon: 'Search' as keyof typeof Icons, prompt: 'Provide a detailed overview of the latest advancements in AI.', description: 'Use Google Search for up-to-date info.', useSearch: true },
  ];

  const handleTaskClick = (task: typeof tasks[0]) => {
    if (task.isGenerator) {
      showToast("Image generation is coming soon!", 'info');
    } else {
      onStartTask(task.prompt, task.useSearch);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8 animate-fade-in">
      <Icons.Logo className="w-20 h-20 mb-4" />
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">How can I help you today?</h1>
      <p className="text-base md:text-lg text-secondary-text mb-8">I'm Geminova, your multimodal AI assistant.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {tasks.map((task) => {
          const Icon = Icons[task.icon];
          return (
            <button
              key={task.title}
              onClick={() => handleTaskClick(task)}
              className="p-4 bg-gray-800/50 border border-glass-border rounded-lg text-left hover:bg-gray-700/70 transition-all duration-300 hover:shadow-glow-primary flex flex-col items-start transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Icon className="w-6 h-6 mb-3 text-primary" />
              <h3 className="font-semibold text-white mb-1">{task.title}</h3>
              <p className="text-sm text-secondary-text">{task.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default WelcomeScreen;