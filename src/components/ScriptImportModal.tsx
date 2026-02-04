import React from 'react';

const getFormatHint = (projectType) => {
  switch (projectType) {
    case 'comic':
      return 'Format: PAGE 1 / Panel 1 / CAPTION: / CHARACTER: dialogue / SFX:';
    case 'screenplay':
      return 'Format: INT. LOCATION - TIME / Action description / CHARACTER NAME / Dialogue / CLOSE UP, WIDE SHOT, etc.';
    case 'stage-play':
      return 'Format: ACT ONE / SCENE 1 / (Stage directions) / CHARACTER: Dialogue / (enters), (exits)';
    case 'tv-series':
      return 'Format: EPISODE 101 / TEASER / INT. LOCATION - TIME / (follows screenplay format)';
    default:
      return '';
  }
};

const ScriptImportModal = (props) => {
  const { projectType } = props;
  const formatHint = getFormatHint(projectType);

  return (
    <div>
      <textarea {...props.textareaProps} />
      {formatHint && <small className="text-[9px] font-mono text-steel-600 mt-2 italic">{formatHint}</small>}
    </div>
  );
};

export default ScriptImportModal;
