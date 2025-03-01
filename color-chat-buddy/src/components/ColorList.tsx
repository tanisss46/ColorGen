import React from "react";
import { ColorCard } from "@/components/ColorCard";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface ColorListProps {
  colors: { value: string; isLocked: boolean }[];
  onColorChange: (index: number, newColor: string) => void;
  onDeleteColor: (index: number) => void;
  onLockChange: (index: number, isLocked: boolean) => void;
  savedColors: { color_value: string }[];
  isAuthenticated: boolean;
  onSaveColor: (color: string) => void;
  onUnsaveColor: (color: string) => void;
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
}

export const ColorList: React.FC<ColorListProps> = ({
  colors,
  onColorChange,
  onDeleteColor,
  onLockChange,
  savedColors = [],
  isAuthenticated = false,
  onSaveColor,
  onUnsaveColor,
  onReorder,
}) => {
  const [copiedColors, setCopiedColors] = React.useState<string[]>([]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    onReorder(sourceIndex, destinationIndex);
  };

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    if (!copiedColors.includes(color)) {
      toast.success('Color copied!', {
        position: 'bottom-right',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: {
          fontSize: '14px',
          padding: '8px 12px',
          minHeight: 'auto',
          width: 'auto'
        }
      });
      setCopiedColors([...copiedColors, color]);
    }
  };

  const handleColorChange = (index: number, newColor: string) => {
    // Only update the changed color, don't touch the others
    onColorChange(index, newColor);
  };

  return (
    <DragDropContext 
      onDragEnd={handleDragEnd}
      enableDefaultSensors={true}
    >
      <Droppable 
        droppableId="colors" 
        direction="horizontal"
      >
        {(provided) => (
          <div 
            className="flex h-[calc(100vh-96px)]" 
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {colors.map((color, index) => {
              const normalizedColor = color.value.toLowerCase();
              const isSaved = savedColors.some(saved => saved.color_value.toLowerCase() === normalizedColor);
              
              return (
                <Draggable 
                  key={`${color.value}-${index}`}
                  draggableId={`${color.value}-${index}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        flexGrow: 1,
                        flexBasis: 0,
                        minWidth: 0,
                        height: "100%",
                      }}
                      className="h-full"
                    >
                      <ColorCard
                        color={color.value}
                        isLocked={color.isLocked}
                        onColorChange={(oldColor, newColor) => handleColorChange(index, newColor)}
                        onDelete={() => onDeleteColor(index)}
                        onLockChange={(isLocked) => onLockChange(index, isLocked)}
                        isAuthenticated={isAuthenticated}
                        isSaved={isSaved}
                        onSave={() => onSaveColor(color.value)}
                        onUnsave={() => onUnsaveColor(color.value)}
                        onCopy={() => handleCopyColor(color.value)}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
