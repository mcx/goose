import { useCallback, useMemo } from 'react';

export interface Command {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export const BUILT_IN_COMMANDS: Command[] = [
  {
    id: 'compact',
    name: 'Compact',
    description: 'Compact the conversation to reduce context size',
    prompt: 'Please compact this conversation',
  },
];

export const useCommands = () => {
  // Return all commands (built-in for now, could include custom commands in the future)
  const commands = useMemo(() => BUILT_IN_COMMANDS, []);

  // Get command by ID
  const getCommand = useCallback((id: string): Command | undefined => {
    return commands.find(cmd => cmd.id === id);
  }, [commands]);

  // Get command by name
  const getCommandByName = useCallback((name: string): Command | undefined => {
    return commands.find(cmd => cmd.name.toLowerCase() === name.toLowerCase());
  }, [commands]);

  // Expand a command's prompt
  const expandCommandPrompt = useCallback((command: Command): string => {
    return command.prompt;
  }, []);

  // Increment usage count (no-op for simplified version)
  const incrementUsage = useCallback((_commandId: string) => {
    // No-op: we don't track usage in the simplified version
  }, []);

  return {
    commands,
    getCommand,
    getCommandByName,
    expandCommandPrompt,
    incrementUsage,
  };
};

export default useCommands;
