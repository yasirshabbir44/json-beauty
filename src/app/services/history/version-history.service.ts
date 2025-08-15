import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

export interface JsonVersion {
  id: string;
  content: string;
  timestamp: Date;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VersionHistoryService {
  private readonly STORAGE_KEY = 'json_beauty_version_history';
  private readonly MAX_VERSIONS = 50;
  
  private versionsSubject = new BehaviorSubject<JsonVersion[]>([]);
  public versions$: Observable<JsonVersion[]> = this.versionsSubject.asObservable();

  constructor() {
    this.loadVersionsFromStorage();
  }

  /**
   * Loads saved versions from local storage
   */
  private loadVersionsFromStorage(): void {
    try {
      const storedVersions = localStorage.getItem(this.STORAGE_KEY);
      if (storedVersions) {
        const parsedVersions = JSON.parse(storedVersions);
        // Convert string timestamps back to Date objects
        const versions = parsedVersions.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
        this.versionsSubject.next(versions);
      }
    } catch (error) {
      console.error('Error loading versions from storage:', error);
      this.versionsSubject.next([]);
    }
  }

  /**
   * Saves versions to local storage
   */
  private saveVersionsToStorage(): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY, 
        JSON.stringify(this.versionsSubject.value)
      );
    } catch (error) {
      console.error('Error saving versions to storage:', error);
    }
  }

  /**
   * Adds a new version to the history
   * @param content The JSON content to save
   * @param name Optional name for the version
   * @returns The newly created version
   */
  addVersion(content: string, name?: string): JsonVersion {
    const versions = this.versionsSubject.value;
    
    // Generate a unique ID
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Create the new version
    const newVersion: JsonVersion = {
      id,
      content,
      timestamp: new Date(),
      name
    };
    
    // Add to the beginning of the array (newest first)
    const updatedVersions = [newVersion, ...versions];
    
    // Limit the number of versions stored
    if (updatedVersions.length > this.MAX_VERSIONS) {
      updatedVersions.pop();
    }
    
    this.versionsSubject.next(updatedVersions);
    this.saveVersionsToStorage();
    
    return newVersion;
  }

  /**
   * Gets all saved versions
   * @returns An array of all versions
   */
  getVersions(): JsonVersion[] {
    return this.versionsSubject.value;
  }

  /**
   * Gets a specific version by ID
   * @param id The ID of the version to retrieve
   * @returns The version if found, undefined otherwise
   */
  getVersionById(id: string): JsonVersion | undefined {
    return this.versionsSubject.value.find(v => v.id === id);
  }

  /**
   * Updates the name of a version
   * @param id The ID of the version to update
   * @param name The new name for the version
   * @returns True if the version was updated, false otherwise
   */
  updateVersionName(id: string, name: string): boolean {
    const versions = this.versionsSubject.value;
    const versionIndex = versions.findIndex(v => v.id === id);
    
    if (versionIndex === -1) {
      return false;
    }
    
    const updatedVersions = [...versions];
    updatedVersions[versionIndex] = {
      ...updatedVersions[versionIndex],
      name
    };
    
    this.versionsSubject.next(updatedVersions);
    this.saveVersionsToStorage();
    
    return true;
  }

  /**
   * Deletes a version by ID
   * @param id The ID of the version to delete
   * @returns True if the version was deleted, false otherwise
   */
  deleteVersion(id: string): boolean {
    const versions = this.versionsSubject.value;
    const updatedVersions = versions.filter(v => v.id !== id);
    
    if (updatedVersions.length === versions.length) {
      return false;
    }
    
    this.versionsSubject.next(updatedVersions);
    this.saveVersionsToStorage();
    
    return true;
  }

  /**
   * Clears all version history
   */
  clearHistory(): void {
    this.versionsSubject.next([]);
    this.saveVersionsToStorage();
  }
}