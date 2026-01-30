import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updatePanelContent } from '../features/panelsSlice';
import { GripVertical, Edit, Save, X, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';

interface PanelCardProps {
    id: string;
    index: number;
    onRemove: (id: string) => void;
    onGenerateImage: (prompt: string) => Promise<string | null>;
}

const PanelCard: React.FC<PanelCardProps> = ({ id, index, onRemove, onGenerateImage }) => {
    const dispatch = useDispatch();
    const panelContent = useSelector((state: RootState) => state.panels.panels.find(p => p.id === id)?.content || '');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(panelContent);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSave = () => {
        dispatch(updatePanelContent({ id, content: editedContent }));
        setIsEditing(false);
    };

    const handleGenerate = async () => {
        const url = await onGenerateImage(prompt);
        if (url) {
            setImageUrl(url);
        }
    };

    return (
        <Panel
        ref={setNodeRef}
        style={style}
        className="border rounded-md p-2 bg-card"
        >
        <PanelGroup direction="horizontal" className="gap-2">
        <div {...attributes} {...listeners} className="cursor-grab touch-none">
        <GripVertical size={20} className="text-muted-foreground" />
        </div>
        <div className="flex-1">
        <h3 className="text-sm font-semibold mb-2">Panel {index + 1}</h3>
        {isEditing ? (
            <div className="space-y-2">
            <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={4}
            className="w-full"
            />
            <div className="flex space-x-2">
            <Button size="sm" onClick={handleSave}>
            <Save size={16} className="mr-1" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            <X size={16} className="mr-1" /> Cancel
            </Button>
            </div>
            </div>
        ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{panelContent || 'Empty panel'}</p>
        )}
        <div className="mt-4">
        <Input
        placeholder="Enter prompt for image generation"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="mb-2"
        />
        <Button size="sm" onClick={handleGenerate}>
        Generate Image
        </Button>
        {imageUrl && <img src={imageUrl} alt="Generated panel" className="mt-2 max-w-full rounded" />}
        </div>
        </div>
        <div className="flex space-x-2">
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
        <Edit size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onRemove(id)}>
        <Trash2 size={16} />
        </Button>
        </div>
        </PanelGroup>
        </Panel>
    );
};

export default PanelCard;
