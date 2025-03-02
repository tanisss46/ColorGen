import React, { useEffect } from "react";
import { ColorCard } from "@/components/ColorCard";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

// CSS ile sürükleme sonrası animasyonun düzgün çalışmasını sağlayan bir stil ekliyoruz
// Bu stil doğrudan bileşen içine enjekte edilecek
const injectGlobalStyle = () => {
  // Bu stil, react-beautiful-dnd'nin sürükleme esnasında ve sonrasında geçiş animasyonunu iyileştirecek
  const styleId = 'beautiful-dnd-fix-style';
  
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .react-beautiful-dnd-draggable {
        transition: transform 0.2s;
      }
      
      /* Sürükleme sırasında renk bilgilerinin konumu */
      .color-info-container {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-bottom: 80px;
        z-index: 5;
      }
    `;
    document.head.appendChild(style);
  }
};

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
  onDragStart?: () => void;
  onDragEnd?: () => void;
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
  onDragStart,
  onDragEnd
}) => {
  const [copiedColors, setCopiedColors] = React.useState<string[]>([]);

  // Kompenenent mount olduğunda global stil enjekte ediyoruz
  useEffect(() => {
    injectGlobalStyle();
    return () => {
      // Clean up - bu örnekte tam gerekli değil ama iyi bir pratik
      const styleEl = document.getElementById('beautiful-dnd-fix-style');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (onDragEnd) {
      onDragEnd();
    }
    
    // If there's no destination or the drop is outside valid areas,
    // the animation will automatically return the item to its source
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
      onDragStart={() => onDragStart && onDragStart()}
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
            style={{
              overflow: 'hidden',
              position: 'relative'
            }}
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
                        height: snapshot.isDragging ? "calc(100vh - 96px)" : "100%",
                        opacity: snapshot.isDragging ? 1 : 1,
                        transform: snapshot.isDragging 
                          ? `${provided.draggableProps.style?.transform}` 
                          : provided.draggableProps.style?.transform,
                        zIndex: snapshot.isDragging ? 9999 : 'auto',
                        boxShadow: snapshot.isDragging ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" : "none",
                        border: snapshot.isDragging ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                        // Add faster transition for returning to position
                        transition: provided.draggableProps.style?.transition 
                          ? provided.draggableProps.style.transition.replace('0.2s', '0.1s')
                          : 'transform 0.1s'
                      }}
                      className={`${snapshot.isDragging ? 'rounded-lg will-change-transform' : ''}`}
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
