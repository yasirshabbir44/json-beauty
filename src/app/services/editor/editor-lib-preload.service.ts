import {Injectable} from '@angular/core';
import {loadAceEditorLibs} from '../../utils/ace-loader.util';
import {loadJson5, loadJsonrepair} from '../../utils/lazy-import.util';

/** Triggers non-blocking preload of editor-only libraries when the editor route loads. */
@Injectable()
export class EditorLibPreloadService {
    constructor() {
        void loadAceEditorLibs();
        void loadJson5();
        void loadJsonrepair();
    }
}
