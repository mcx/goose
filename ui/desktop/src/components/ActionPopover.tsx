const popoverStyles = `
@keyframes popoverFadeIn {
  from {
    opacity: 0;
    transform: translateY(-100%) scaleY(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(-100%) scaleY(1);
  }
}
`;

// Inject styles
if (typeof document !== "undefined" && !document.getElementById("popover-styles")) {
  const style = document.createElement("style");
  style.id = "popover-styles";
  style.textContent = popoverStyles;
  document.head.appendChild(style);
}

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Zap, SearchX } from 'lucide-react';
import { useCommands } from '../hooks/useCommands';

interface ActionItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  prompt?: string;
}

interface ActionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (actionId: string) => void;
  position: { x: number; y: number };
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  query?: string;
}

const ActionPopover = forwardRef<
  { getDisplayActions: () => ActionItem[]; selectAction: (index: number) => void },
  ActionPopoverProps
>(({ isOpen, onClose, onSelect, position, selectedIndex, onSelectedIndexChange, query = '' }, ref) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { commands } = useCommands();

  // Convert all commands to action items
  const allActions: ActionItem[] = commands.map(cmd => ({
    id: cmd.id,
    label: cmd.name,
    description: cmd.description,
    icon: <Zap size={16} />,
    prompt: cmd.prompt,
    action: () => {
      console.log('Command triggered:', cmd.name);
    },
  }));

  // Filter commands based on query
  const filteredActions = query
    ? allActions.filter(action => {
        const searchTerm = query.toLowerCase();
        return (
          action.label.toLowerCase().includes(searchTerm) ||
          action.description.toLowerCase().includes(searchTerm)
        );
      })
    : allActions;

  // Sort alphabetically
  const sortedActions = filteredActions.sort((a, b) => 
    a.label.localeCompare(b.label)
  );

  // Expose methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      getDisplayActions: () => sortedActions,
      selectAction: (index: number) => {
        console.log('⌨️ ActionPopover: selectAction called via keyboard', { index, actionId: sortedActions[index]?.id });
        if (sortedActions[index]) {
          console.log('🔄 ActionPopover: Calling onSelect from selectAction:', sortedActions[index].id);
          onSelect(sortedActions[index].id);
          sortedActions[index].action();
          setTimeout(() => {
            onClose();
          }, 10);
        }
      },
    }),
    [sortedActions, onSelect, onClose]
  );

  // Handle clicks outside the popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleItemClick = (index: number) => {
    console.log('🎯 ActionPopover: handleItemClick called', { index, actionId: sortedActions[index].id });
    console.log('📋 ActionPopover: onSelect function:', onSelect);
    console.log('🔄 ActionPopover: About to call onSelect with:', sortedActions[index].id);
    
    onSelectedIndexChange(index);
    
    // Call onSelect first - this should trigger handleActionSelect in ChatInput
    onSelect(sortedActions[index].id);
    
    console.log('✅ ActionPopover: onSelect called successfully');
    
    // Call the local action (just for logging)
    sortedActions[index].action();
    
    // Close popover after a small delay to allow text replacement to complete
    console.log('🚪 ActionPopover: Closing popover after delay');
    setTimeout(() => {
      onClose();
    }, 10);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-background-default border border-borderStandard rounded-2xl min-w-80 max-w-md "
      style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)", transformOrigin: "bottom", animation: "popoverFadeIn 0.2s ease-out forwards", opacity: 0, transform: "translateY(-100%) scaleY(0.8)",
        left: position.x,
        top: position.y - 10,
        
      }}
    >
      <div className="p-3">
        <div className="mb-2">
          <h3 className="text-sm font-medium text-textStandard">
            {query ? 'Search Results' : 'Commands'}
          </h3>
          <p className="text-xs text-textSubtle">
            {query ? `Commands matching "${query}"` : 'Available slash commands'}
          </p>
        </div>
        
        <div ref={listRef} className="space-y-1">
          {sortedActions.length > 0 ? (
            sortedActions.map((action, index) => (
              <div
                key={action.id}
                onClick={() => handleItemClick(index)}
                className={`flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition-all ${
                  index === selectedIndex
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex-shrink-0 text-textSubtle">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mx-auto">
                    <div className="text-sm font-medium text-textStandard">
                      {action.label}
                    </div>
                  </div>
                  <div className="text-xs text-textSubtle">
                    {action.description}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-textSubtle">
              <div className="text-sm mb-2 text-textMuted">
                <SearchX size={24} className="text-textMuted mx-auto mb-1" />
                No commands found
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ActionPopover.displayName = 'ActionPopover';

export default ActionPopover;
