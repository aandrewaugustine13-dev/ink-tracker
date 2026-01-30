// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import panelsReducer from './features/panelsSlice'; // Adjust if path is different, e.g., '../features/panelsSlice'

// Add other reducers here if you have 'em (e.g., for projects, characters, etc.)
// import otherReducer from './features/otherSlice';

export const store = configureStore({
    reducer: {
        panels: panelsReducer,
        // other: otherReducer,
    },
    // Optional middleware/devtools tweaks if needed
    // middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    devTools: process.env.NODE_ENV !== 'production', // Enables Redux DevTools in dev
});

// Export types for hooks/useSelector
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
