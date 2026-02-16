/**
 * Suggested Prompts Configuration
 *
 * This file contains the list of pre-populated prompts that appear on the chat landing page.
 * Users can click these prompts to quickly start a conversation.
 *
 * To add/edit prompts:
 * 1. Add or modify items in the SUGGESTED_PROMPTS array below
 * 2. Each prompt should be a clear, actionable question or statement
 * 3. Keep prompts concise (ideally under 50 characters for better display)
 * 4. The prompts will appear in the order listed here
 */

export const SUGGESTED_PROMPTS = [
  'What are the latest market trends?',
  'Help me analyze my portfolio',
  'Adani Fundamentals',
  'What stocks should I consider?',
  'whats the price of repco today?',
  'What is P/E ratio of repco?',
  '52 week high and low of repco',
  'Buy 1 share of repco',
  'Sell 1 share of repco',
  'Repco technical analysis?',
  'complete overview of repco?',
];

/**
 * Maximum number of prompts to display at once
 * Adjust this value if you want to show more or fewer prompts
 */
export const MAX_SUGGESTED_PROMPTS = 4;

// Debug logging
console.log('=================');
console.log('SUGGESTED PROMPTS CONFIG LOADED');
console.log('=================');
console.log('Total prompts configured:', SUGGESTED_PROMPTS.length);
console.log('Max prompts to display:', MAX_SUGGESTED_PROMPTS);
console.log('Prompts:', SUGGESTED_PROMPTS);
console.log('=================');
