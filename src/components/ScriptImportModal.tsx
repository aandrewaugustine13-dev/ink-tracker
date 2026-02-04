import { useState } from 'react';
import parseScript from '../services/scriptParser';
import parseScreenplay from '../services/screenplayParser';
import parseStagePlay from '../services/stagePlayParser';
import parseTVScript from '../services/tvSeriesParser';
import { Project } from '../types';

interface Props {
    project: Project;
    onClose: () => void;
    onImport: (result: ParseResult, scriptText: string) => void;
}

const ScriptImportModal: React.FC<Props> = ({ project, onClose, onImport }) => {
    const [result, setResult] = useState<ParseResult>();
    
    const handleParse = () => {
        let parsed: ParseResult;
        
        // Select parser based on project type
        switch (project.projectType) {
            case 'screenplay':
                parsed = parseScreenplay(script);
                break;
            case 'stage-play':
                parsed = parseStagePlay(script);
                break;
            case 'tv-series':
                parsed = parseTVScript(script);
                break;
            case 'comic':
            case 'graphic-novel':
            case undefined:
            default:
                parsed = parseScript(script);
                break;
        }
        
        setResult(parsed);
        setEditableCharacters(parsed.characters);
    };
    
    // Get appropriate vocabulary based on project type
    const getPageLabel = () => {
        const type = project.projectType;
        if (type === 'screenplay' || type === 'tv-series') return 'Scenes';
        if (type === 'stage-play') return 'Scenes';
        return 'Pages';
    };
    
    const getPanelLabel = () => {
        const type = project.projectType;
        if (type === 'screenplay' || type === 'tv-series') return 'Shots';
        if (type === 'stage-play') return 'Beats';
        return 'Panels';
    };
    
    return (
        <div>
            <p className="text-[9px] font-mono text-steel-500 uppercase">{getPageLabel()}</p>
            <p className="text-[9px] font-mono text-steel-500 uppercase">{getPanelLabel()}</p>
            <p>Import {result.pages.length} {getPageLabel()} → Storyboard</p>
            {/* Other existing JSX */}
        </div>
    );
};

export default ScriptImportModal;
