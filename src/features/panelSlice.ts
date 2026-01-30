// src/features/panelsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Panel {
    id: string;
    content: string;
    // Add more if needed, like prompt or imageUrl from your types
}

interface PanelsState {
    panels: Panel[];
}

const initialState: PanelsState = {
    panels: [],
};

const panelsSlice = createSlice({
    name: 'panels',
    initialState,
    reducers: {
        updatePanelContent: (state, action: PayloadAction<{ id: string; content: string }>) => {
            const panel = state.panels.find((p) => p.id === action.payload.id);
            if (panel) {
                panel.content = action.payload.content;
            }
        },
    },
});

export const { updatePanelContent } = panelsSlice.actions;
export default panelsSlice.reducer;
