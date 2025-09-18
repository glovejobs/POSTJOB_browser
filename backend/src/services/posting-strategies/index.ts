import { BasePostingStrategy } from './base.strategy';
import { HarvardPostingStrategy } from './harvard.strategy';
import { StanfordPostingStrategy } from './stanford.strategy';
import { MITPostingStrategy } from './mit.strategy';
import { YalePostingStrategy } from './yale.strategy';
import { PrincetonPostingStrategy } from './princeton.strategy';

// Map of board names to their posting strategies
export const postingStrategies: Record<string, new () => BasePostingStrategy> = {
  'harvard': HarvardPostingStrategy,
  'stanford': StanfordPostingStrategy,
  'mit': MITPostingStrategy,
  'yale': YalePostingStrategy,
  'princeton': PrincetonPostingStrategy,
};

// Factory function to create posting strategy instances
export function createPostingStrategy(boardName: string): BasePostingStrategy | null {
  // Extract just the university name part (e.g., "Harvard University" -> "harvard")
  const strategyKey = boardName.toLowerCase()
    .replace(/\s+university.*$/i, '') // Remove "University" and anything after
    .replace(/\s+/g, ''); // Remove remaining spaces

  const StrategyClass = postingStrategies[strategyKey];

  if (!StrategyClass) {
    console.error(`No posting strategy found for board: ${boardName} (key: ${strategyKey})`);
    return null;
  }

  return new StrategyClass();
}

// Export all strategies
export {
  BasePostingStrategy,
  HarvardPostingStrategy,
  StanfordPostingStrategy,
  MITPostingStrategy,
  YalePostingStrategy,
  PrincetonPostingStrategy,
};