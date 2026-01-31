import React, { useEffect, useState } from 'react';\nimport { useSortable } from '@dnd-kit/sortable';\nimport { CSS } from '@dnd-kit/utilities';\nimport { Panel, Group } from 'react-resizable-panels';\nimport { GripVertical, Edit, Save, X, Trash2 } from 'lucide-react';\n\ninterface PanelCardProps {\n  panel: any;\n  pageId?: string;\n  dispatch?: any;\n  project?: any;\n  characters?: any[];\n  index: number;\n  total?: number;\n  showGutters?: boolean;\n  activePage?: any;\n  isOverlay?: boolean;\n  onGenerateImage?: (prompt: string) => Promise<string | null>;\n  onRemove?: (id: string) => void;\n}\n\nconst PanelCard: React.FC<PanelCardProps> = ({\n  panel,\n  index,\n  dispatch,\n  onGenerateImage,\n  onRemove,\n}) => {\n  const id = panel?.id ?? `panel-${index}`;\n  const content = panel?.content ?? '';\n  const [isEditing, setIsEditing] = useState(false);\n  const [editedContent, setEditedContent] = useState<string>(content);\n  const [imageUrl, setImageUrl] = useState<string | null>(panel?.imageUrl ?? null);\n  const [prompt, setPrompt] = useState<string>(panel?.prompt ?? '');\n\n  useEffect(() => {\n    setEditedContent(content);\n  }, [content]);\n\n  useEffect(() => {\n    setImageUrl(panel?.imageUrl ?? null);\n  }, [panel?.imageUrl]);\n\n  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });\n\n  const style = {\n    transition,\n    transform: CSS.Transform.toString(transform),\n    opacity: isDragging ? 0.5 : 1,\n  };\n\n  const handleSave = () => {\n    if (dispatch) {\n      dispatch({ type: 'UPDATE_PANEL', panelId: id, updates: { content: editedContent } });\n    }\n    setIsEditing(false);\n  };\n\n  const handleGenerate = async () => {\n    if (!onGenerateImage) return;\n    const url = await onGenerateImage(prompt);\n    if (url) {\n      setImageUrl(url);\n      if (dispatch) {\n        dispatch({ type: 'UPDATE_PANEL', panelId: id, updates: { imageUrl: url } });\n      }\n    }\n  };\n\n  const handleRemove = () => {\n    if (onRemove) onRemove(id);\n    else if (dispatch) dispatch({ type: 'REMOVE_PANEL', panelId: id });\n  };\n\n  return (\n    <div ref={setNodeRef} style={style} className="border rounded-md p-2 bg-card">\n      <Group>\n        <Panel defaultSize={10} minSize={5}>\n          <div {...attributes} {...listeners} className="cursor-grab touch-none h-full flex items-center justify-center">\n            <GripVertical size={20} className="text-muted-foreground" />\n          </div>\n        </Panel>\n\n        <Panel defaultSize={80}>\n          <div className="flex-1">\n            <h3 className="text-sm font-semibold mb-2">Panel {index + 1}</h3>\n\n            {isEditing ? (\n              <div className="space-y-2">\n                <textarea\n                  value={editedContent}\n                  onChange={(e) => setEditedContent(e.target.value)}\n                  rows={4}\n                  className="w-full border rounded px-2 py-1 text-sm bg-ink-950 border-ink-700 text-steel-300 focus:border-ember-500 outline-none"\n                />\n                <div className="flex space-x-2">\n                  <button\n                    onClick={handleSave}\n                    className="flex items-center px-3 py-1 text-sm bg-ember-500 text-ink-950 rounded hover:bg-ember-400 transition-colors"\n                  >\n                    <Save size={16} className="mr-1" /> Save\n                  </button>\n                  <button\n                    onClick={() => setIsEditing(false)}\n                    className="flex items-center px-3 py-1 text-sm border border-ink-700 text-steel-400 rounded hover:bg-ink-700 transition-colors"\n                  >\n                    <X size={16} className="mr-1" /> Cancel\n                  </button>\n                </div>\n              </div>\n            ) : (\n              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content || 'Empty panel'}</p>\n            )}\n\n            <div className="mt-4">\n              <input\n                type="text"\n                placeholder="Enter prompt for image generation"\n                value={prompt}\n                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}\n                className="w-full mb-2 border rounded px-2 py-1 text-sm bg-ink-950 border-ink-700 text-steel-300 focus:border-ember-500 outline-none"\n              />\n              <div className="flex items-center gap-2">\n                <button\n                  onClick={handleGenerate}\n                  className="px-3 py-1 text-sm bg-ember-500 text-ink-950 rounded hover:bg-ember-400 transition-colors"\n                >\n                  Generate Image\n                </button>\n                <button\n                  onClick={() => setIsEditing(true)}\n                  className="p-2 text-steel-400 hover:text-ember-500 transition-colors"\n                >\n                  <Edit size={16} />\n                </button>\n                <button\n                  onClick={handleRemove}\n                  className="p-2 text-steel-400 hover:text-red-500 transition-colors"\n                >\n                  <Trash2 size={16} />\n                </button>\n              </div>\n\n              {imageUrl && <img src={imageUrl} alt="Generated panel" className="mt-2 max-w-full rounded" />}\n            </div>\n          </div>\n        </Panel>\n\n        <Panel defaultSize={10} minSize={5}>\n          <div className="flex items-center justify-center p-1">\n            {/* reserved for any additional controls on the right */}\n          </div>\n        </Panel>\n      </Group>\n    </div>\n  );\n};\n\nexport default PanelCard;\n

import React, { useEffect, useState } from 'react';

import { useSortable } from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

import { Panel, Group } from 'react-resizable-panels';

import { GripVertical, Edit, Save, X, Trash2 } from 'lucide-react';


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


  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });


  const style = {

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

          <div {...attributes} {...listeners} className="cursor-grab touch-none h-full flex items-center justify-center">

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

              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content || 'Empty panel'}</p>

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


              {imageUrl && <img src={imageUrl} alt="Generated panel" className="mt-2 max-w-full rounded" />}

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
