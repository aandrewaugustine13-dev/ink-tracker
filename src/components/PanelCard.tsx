import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Group, Panel } from 'react-resizable-panels';
import { Edit, GripVertical, Save, Trash2, X } from 'lucide-react';

interface PanelCardProps {
  panel: any;
  pageId?: string;
  dispatch?: any;
  project?: any;
  characters?: any[];
  index: number;
  total?: number;
  showGutters?: boolean;
  activePage?: any;
  isOverlay?: boolean;
  onGenerateImage?: (prompt: string) => Promise<string | null>;
  onRemove?: (id: string) => void;
}

const PanelCard: React.FC<PanelCardProps> = ({
  panel,
  index,
  dispatch,
  onGenerateImage,
  onRemove,
}) => {
  const id = panel?.id ?? `panel-${index}`;
  const content = panel?.content ?? '';

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(content);
  const [imageUrl, setImageUrl] = useState<string | null>(panel?.imageUrl ?? null);
  const [prompt, setPrompt] = useState<string>(panel?.prompt ?? '');

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  useEffect(() => {
    setImageUrl(panel?.imageUrl ?? null);
  }, [panel?.imageUrl]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (dispatch) {
      dispatch({ type: 'UPDATE_PANEL', panelId: id, updates: { content: editedContent } });
    }
    setIsEditing(false);
  };

  const handleGenerate = async () => {
    if (!onGenerateImage) return;
    const url = await onGenerateImage(prompt);
    if (url) {
      setImageUrl(url);
      if (dispatch) {
        dispatch({ type: 'UPDATE_PANEL', panelId: id, updates: { imageUrl: url } });
      }
    }
  };

  const handleRemove = () => {
    if (onRemove) onRemove(id);
    else if (dispatch) dispatch({ type: 'REMOVE_PANEL', panelId: id });
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-md p-2 bg-card">
      <Group>
        <Panel defaultSize={10} minSize={5}>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none h-full flex items-center justify-center"
          >
            <GripVertical size={20} className="text-muted-foreground" />
          </div>
        </Panel>

        <Panel defaultSize={80}>
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-2">Panel {index + 1}</h3>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={4}
                  className="w-full border rounded px-2 py-1 text-sm bg-ink-950 border-ink-700 text-steel-300 focus:border-ember-500 outline-none"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center px-3 py-1 text-sm bg-ember-500 text-ink-950 rounded hover:bg-ember-400 transition-colors"
                  >
                    <Save size={16} className="mr-1" /> Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center px-3 py-1 text-sm border border-ink-700 text-steel-400 rounded hover:bg-ink-700 transition-colors"
                  >
                    <X size={16} className="mr-1" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {content || 'Empty panel'}
              </p>
            )}

            <div className="mt-4">
              <input
                type="text"
                placeholder="Enter prompt for image generation"
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
                className="w-full mb-2 border rounded px-2 py-1 text-sm bg-ink-950 border-ink-700 text-steel-300 focus:border-ember-500 outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  className="px-3 py-1 text-sm bg-ember-500 text-ink-950 rounded hover:bg-ember-400 transition-colors"
                >
                  Generate Image
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-steel-400 hover:text-ember-500 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-2 text-steel-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {imageUrl && (
                <img src={imageUrl} alt="Generated panel" className="mt-2 max-w-full rounded" />
              )}
            </div>
          </div>
        </Panel>

        <Panel defaultSize={10} minSize={5}>
          <div className="flex items-center justify-center p-1">
            {/* reserved for any additional controls on the right */}
          </div>
        </Panel>
      </Group>
    </div>
  );
};

export default PanelCard;