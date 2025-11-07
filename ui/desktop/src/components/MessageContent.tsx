import React, { useMemo } from 'react';
import ActionPill from './ActionPill';
import MentionPill from './MentionPill';
import { Zap } from 'lucide-react';
import { useCommands } from '../hooks/useCommands';

interface MessageContentProps {
  content: string;
  className?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, className }) => {
  const { commands } = useCommands();
  
  const parsedContent = useMemo(() => {
    // Find all [Action] and @mention patterns and replace them with pill components
    const actionRegex = /\[([^\]]+)\]/g;
    const mentionRegex = /@([^\s]+)/g;
    const parts: Array<{ type: 'text' | 'action' | 'mention'; content: string; actionId?: string; fileName?: string }> = [];

    // Find all matches and sort by position
    const allMatches = [];

    // Find all action matches
    let actionMatch;
    actionRegex.lastIndex = 0;
    while ((actionMatch = actionRegex.exec(content)) !== null) {
      allMatches.push({
        type: 'action',
        index: actionMatch.index,
        length: actionMatch[0].length,
        content: actionMatch[1]
      });
    }

    // Find all mention matches
    let mentionMatch;
    mentionRegex.lastIndex = 0;
    while ((mentionMatch = mentionRegex.exec(content)) !== null) {
      allMatches.push({
        type: 'mention',
        index: mentionMatch.index,
        length: mentionMatch[0].length,
        content: mentionMatch[1] // filename without @
      });
    }

    allMatches.sort((a, b) => a.index - b.index);

    let currentIndex = 0;

    for (const match of allMatches) {
      // Add text before this match
      if (match.index > currentIndex) {
        parts.push({
          type: 'text',
          content: content.slice(currentIndex, match.index),
        });
      }

      if (match.type === 'action') {
        // Add the action
        const actionLabel = match.content;
        const matchedCommand = commands.find(cmd => cmd.name === actionLabel);

        parts.push({
          type: 'action',
          content: actionLabel,
          actionId: matchedCommand?.id || actionLabel.toLowerCase().replace(/\s+/g, '-'),
        });
      } else if (match.type === 'mention') {
        // Add the mention
        parts.push({
          type: 'mention',
          content: match.content, // filename without @
          fileName: match.content,
        });
      }

      currentIndex = match.index + match.length;
    }
    
    // Add remaining text
    if (currentIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(currentIndex),
      });
    }

    // If no matches found, return the original content as a single text part
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content: content,
      });
    }

    return parts;
  }, [content, commands]);

  return (
    <span className={`inline ${className || ''}`}>
      {parsedContent.map((part, index) => {
        if (part.type === 'action' && part.actionId) {
          const matchedCommand = commands.find(cmd => cmd.id === part.actionId);
          return (
            <ActionPill
              key={`action-${index}`}
              actionId={part.actionId}
              label={part.content}
              icon={<Zap size={12} />}
              variant="message"
              size="sm"
              // No onRemove for message display - pills are read-only
            />
          );
        } else if (part.type === 'mention' && part.fileName) {
          return (
            <MentionPill
              key={`mention-${index}`}
              fileName={part.fileName}
              filePath={`@${part.fileName}`}
              variant="message"
              size="sm"
              // No onRemove for message display - pills are read-only
            />
          );
        } else if (part.content.trim()) {
          return (
            <span
              key={`text-${index}`}
              className={`inline ${className || ''}`}
              dangerouslySetInnerHTML={{
                __html: part.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`(.*?)`/g, '<code>$1</code>')
                  .replace(/\n/g, '<br>')
              }}
            />
          );
        }
        return null;
      })}
    </span>
  );
};

export default MessageContent;
