import { Injectable } from '@angular/core';

/**
 * Service for search and replace operations in text
 * Follows the Single Responsibility Principle by focusing only on search and replace concerns
 */
@Injectable({
  providedIn: 'root'
})
export class SearchReplaceService {
  constructor() {}

  /**
   * Searches for occurrences of a pattern in text
   * @param text The text to search in
   * @param searchPattern The pattern to search for
   * @param isRegex Whether the pattern is a regular expression
   * @param isCaseSensitive Whether the search is case sensitive
   * @returns Array of search results with positions
   */
  search(
    text: string, 
    searchPattern: string, 
    isRegex: boolean = false, 
    isCaseSensitive: boolean = false
  ): { index: number, length: number, match: string }[] {
    if (!text || !searchPattern) {
      return [];
    }

    const results: { index: number, length: number, match: string }[] = [];
    
    try {
      if (isRegex) {
        // Create a RegExp object with the appropriate flags
        const flags = isCaseSensitive ? 'g' : 'gi';
        const regex = new RegExp(searchPattern, flags);
        
        // Find all matches
        let match;
        while ((match = regex.exec(text)) !== null) {
          results.push({
            index: match.index,
            length: match[0].length,
            match: match[0]
          });
          
          // Avoid infinite loops with zero-length matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        // Simple string search
        const searchFor = isCaseSensitive ? searchPattern : searchPattern.toLowerCase();
        const searchIn = isCaseSensitive ? text : text.toLowerCase();
        
        let index = 0;
        while ((index = searchIn.indexOf(searchFor, index)) !== -1) {
          results.push({
            index,
            length: searchPattern.length,
            match: text.substr(index, searchPattern.length)
          });
          index += searchPattern.length;
        }
      }
    } catch (error) {
      console.error('Error in search:', error);
    }
    
    return results;
  }

  /**
   * Replaces occurrences of a pattern in text
   * @param text The text to perform replacements in
   * @param searchPattern The pattern to search for
   * @param replacePattern The replacement text
   * @param isRegex Whether the pattern is a regular expression
   * @param isCaseSensitive Whether the search is case sensitive
   * @returns The text with replacements applied
   */
  replace(
    text: string, 
    searchPattern: string, 
    replacePattern: string, 
    isRegex: boolean = false, 
    isCaseSensitive: boolean = false
  ): string {
    if (!text || !searchPattern) {
      return text;
    }
    
    try {
      if (isRegex) {
        // Create a RegExp object with the appropriate flags
        const flags = isCaseSensitive ? 'g' : 'gi';
        const regex = new RegExp(searchPattern, flags);
        
        // Perform the replacement
        return text.replace(regex, replacePattern);
      } else {
        // Simple string replacement
        if (!isCaseSensitive) {
          // For case-insensitive non-regex replacement, we need to implement it manually
          const searchFor = searchPattern.toLowerCase();
          const parts: string[] = [];
          const searchIn = text.toLowerCase();
          
          let lastIndex = 0;
          let index = 0;
          
          while ((index = searchIn.indexOf(searchFor, lastIndex)) !== -1) {
            // Add the text before the match
            parts.push(text.substring(lastIndex, index));
            
            // Add the replacement
            parts.push(replacePattern);
            
            // Move past this match
            lastIndex = index + searchPattern.length;
          }
          
          // Add the remaining text
          if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
          }
          
          return parts.join('');
        } else {
          // Case-sensitive string replacement
          return text.split(searchPattern).join(replacePattern);
        }
      }
    } catch (error) {
      console.error('Error in replace:', error);
      return text;
    }
  }

  /**
   * Replaces all occurrences of a pattern in text
   * @param text The text to perform replacements in
   * @param searchPattern The pattern to search for
   * @param replacePattern The replacement text
   * @param isRegex Whether the pattern is a regular expression
   * @param isCaseSensitive Whether the search is case sensitive
   * @returns The text with all replacements applied
   */
  replaceAll(
    text: string, 
    searchPattern: string, 
    replacePattern: string, 
    isRegex: boolean = false, 
    isCaseSensitive: boolean = false
  ): string {
    return this.replace(text, searchPattern, replacePattern, isRegex, isCaseSensitive);
  }
}