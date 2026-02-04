import { getDefaultAspectRatio } from './helpers';
import { AspectRatio } from '../types';

describe('getDefaultAspectRatio', () => {
    test('returns TALL (3:4) for comic projects', () => {
        expect(getDefaultAspectRatio('comic')).toBe(AspectRatio.TALL);
    });

    test('returns WIDE (16:9) for screenplay projects', () => {
        expect(getDefaultAspectRatio('screenplay')).toBe(AspectRatio.WIDE);
    });

    test('returns WIDE (16:9) for tv-series projects', () => {
        expect(getDefaultAspectRatio('tv-series')).toBe(AspectRatio.WIDE);
    });

    test('returns WIDE (16:9) for stage-play projects', () => {
        expect(getDefaultAspectRatio('stage-play')).toBe(AspectRatio.WIDE);
    });

    test('returns WIDE (16:9) for undefined project type', () => {
        expect(getDefaultAspectRatio(undefined)).toBe(AspectRatio.WIDE);
    });
});
