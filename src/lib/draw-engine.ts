// ============================================================
// GOLF CHARITY PLATFORM — DRAW ENGINE
// Handles random & algorithmic draw generation
// ============================================================

import type { DrawEntry, DrawSimulationResult, MatchType } from '@/types'

export const SCORE_MIN = 1
export const SCORE_MAX = 45
export const DRAW_NUMBERS_COUNT = 5

/**
 * Generate random winning numbers (standard lottery-style)
 */
export function generateRandomDrawNumbers(): number[] {
  const numbers: Set<number> = new Set()
  while (numbers.size < DRAW_NUMBERS_COUNT) {
    numbers.add(Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN)
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

/**
 * Generate algorithmic draw numbers weighted by score frequency
 * Scores that appear more often are more likely to be drawn
 */
export function generateAlgorithmicDrawNumbers(
  allEntries: DrawEntry[],
  mode: 'frequent' | 'least_frequent' = 'frequent'
): number[] {
  // Build frequency map of all scores
  const frequency: Record<number, number> = {}
  for (let i = SCORE_MIN; i <= SCORE_MAX; i++) {
    frequency[i] = 0
  }

  allEntries.forEach(entry => {
    entry.entry_numbers.forEach(num => {
      if (num >= SCORE_MIN && num <= SCORE_MAX) {
        frequency[num] = (frequency[num] || 0) + 1
      }
    })
  })

  // Build weighted pool
  const weightedPool: number[] = []
  Object.entries(frequency).forEach(([num, count]) => {
    const weight = mode === 'frequent'
      ? Math.max(count, 1)
      : Math.max(10 - count, 1)

    for (let i = 0; i < weight; i++) {
      weightedPool.push(parseInt(num))
    }
  })

  // Pick unique numbers from weighted pool
  const selected: Set<number> = new Set()
  const maxAttempts = 1000
  let attempts = 0

  while (selected.size < DRAW_NUMBERS_COUNT && attempts < maxAttempts) {
    const idx = Math.floor(Math.random() * weightedPool.length)
    selected.add(weightedPool[idx])
    attempts++
  }

  // Fallback to random if needed
  while (selected.size < DRAW_NUMBERS_COUNT) {
    selected.add(Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN)
  }

  return Array.from(selected).sort((a, b) => a - b)
}

/**
 * Count how many winning numbers match a user's entry
 */
export function countMatches(
  userNumbers: number[],
  winningNumbers: number[]
): number {
  const winningSet = new Set(winningNumbers)
  return userNumbers.filter(n => winningSet.has(n)).length
}

/**
 * Determine prize tier from match count
 */
export function getMatchTier(matchCount: number): MatchType | null {
  if (matchCount >= 5) return 'five_match'
  if (matchCount === 4) return 'four_match'
  if (matchCount === 3) return 'three_match'
  return null
}

/**
 * Calculate prize pools from total pool amount
 */
export function calculatePrizePools(
  totalPool: number,
  jackpotRollover: number = 0,
  settings = { five_match_pool_share: 40, four_match_pool_share: 35, three_match_pool_share: 25 }
) {
  const jackpotPool = (totalPool * settings.five_match_pool_share) / 100 + jackpotRollover
  const fourMatchPool = (totalPool * settings.four_match_pool_share) / 100
  const threeMatchPool = (totalPool * settings.three_match_pool_share) / 100

  return { jackpotPool, fourMatchPool, threeMatchPool }
}

/**
 * Run a full draw simulation
 */
export function runDrawSimulation(
  entries: DrawEntry[],
  winningNumbers: number[],
  totalPool: number,
  jackpotRollover: number = 0
): DrawSimulationResult {
  const { jackpotPool, fourMatchPool, threeMatchPool } = calculatePrizePools(totalPool, jackpotRollover)

  const fiveMatchWinners: DrawEntry[] = []
  const fourMatchWinners: DrawEntry[] = []
  const threeMatchWinners: DrawEntry[] = []

  entries.forEach(entry => {
    const matches = countMatches(entry.entry_numbers, winningNumbers)
    const tier = getMatchTier(matches)

    if (tier === 'five_match') fiveMatchWinners.push({ ...entry, match_count: matches, prize_tier: tier })
    else if (tier === 'four_match') fourMatchWinners.push({ ...entry, match_count: matches, prize_tier: tier })
    else if (tier === 'three_match') threeMatchWinners.push({ ...entry, match_count: matches, prize_tier: tier })
  })

  // Split prize equally among winners in same tier
  const jackpotPrizePerWinner = fiveMatchWinners.length > 0
    ? jackpotPool / fiveMatchWinners.length : 0
  const fourMatchPrizePerWinner = fourMatchWinners.length > 0
    ? fourMatchPool / fourMatchWinners.length : 0
  const threeMatchPrizePerWinner = threeMatchWinners.length > 0
    ? threeMatchPool / threeMatchWinners.length : 0

  return {
    winning_numbers: winningNumbers,
    five_match_winners: fiveMatchWinners.map(e => ({ ...e, prize_amount: jackpotPrizePerWinner })),
    four_match_winners: fourMatchWinners.map(e => ({ ...e, prize_amount: fourMatchPrizePerWinner })),
    three_match_winners: threeMatchWinners.map(e => ({ ...e, prize_amount: threeMatchPrizePerWinner })),
    jackpot_amount: jackpotPool,
    four_match_prize: fourMatchPool,
    three_match_prize: threeMatchPool,
    total_pool: totalPool,
  }
}

/**
 * Calculate total prize pool from subscriber count
 */
export function calculateTotalPool(
  activeSubscribers: number,
  monthlyAmount: number = 20,
  yearlyAmount: number = 200,
  monthlyCount: number = 0,
  yearlyCount: number = 0,
  poolContributionPercentage: number = 50
): number {
  const monthlyRevenue = monthlyCount * monthlyAmount
  const yearlyMonthlyRevenue = (yearlyCount * yearlyAmount) / 12
  const totalMonthlyRevenue = monthlyRevenue + yearlyMonthlyRevenue
  return (totalMonthlyRevenue * poolContributionPercentage) / 100
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
