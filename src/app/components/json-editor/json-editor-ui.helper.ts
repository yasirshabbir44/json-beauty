export type PanelFocus = 'input' | 'output';

export interface PanelMaximizeState {
    workspaceLayout: 'single' | 'dual';
    singlePaneFocus: PanelFocus;
    isInputMaximized: boolean;
    isOutputMaximized: boolean;
}

export class JsonEditorUiHelper {
    static readonly DEFAULT_ROOT_TREE_NODE = '$';

    static clampPanelWidth(widthPercent: number, min = 25, max = 75): number {
        return Math.min(max, Math.max(min, widthPercent));
    }

    static applyPanelMaximize(state: PanelMaximizeState, panel: PanelFocus): PanelMaximizeState {
        if (state.workspaceLayout === 'single') {
            return {
                ...state,
                singlePaneFocus: panel
            };
        }

        if (panel === 'input') {
            return {
                ...state,
                isInputMaximized: !state.isInputMaximized,
                isOutputMaximized: false
            };
        }

        return {
            ...state,
            isOutputMaximized: !state.isOutputMaximized,
            isInputMaximized: false
        };
    }

    static tryParseTreeData(jsonString: string): { success: true; value: unknown } | { success: false; value: null } {
        try {
            return {success: true, value: JSON.parse(jsonString)};
        } catch {
            return {success: false, value: null};
        }
    }
}
