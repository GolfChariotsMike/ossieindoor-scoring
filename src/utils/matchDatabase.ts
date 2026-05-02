import { supabase } from "@/integrations/supabase/client";
import { savePendingScore, getPendingScores, removePendingScore } from "@/services/indexedDB";
import { isOffline } from "@/utils/offlineMode";
import { parseISO, isValid } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toISOFixtureTime = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  if (raw.includes('T')) return raw; // already ISO
  if (/\d{2}\/\d{2}\/\d{4}/.test(raw)) {
    const [datePart, timePart = '00:00'] = raw.split(' ');
    const [d, m, y] = datePart.split('/');
    const iso = `${y}-${m}-${d}T${timePart}:00`;
    const parsed = new Date(iso);
    return isValid(parsed) ? parsed.toISOString() : undefined;
  }
  return undefined;
};

const buildUpsertPayload = (
  matchId: string,
  homeScores: number[],
  awayScores: number[],
  courtNumber: number,
  division: string,
  homeTeam: string,
  awayTeam: string,
  fixtureStartTime: string | undefined,
  aceBlockStats: { homeAces?: number; awayAces?: number; homeBlocks?: number; awayBlocks?: number }
) => {
  const homeSetsWon = homeScores.reduce((acc, s, i) => acc + (s > awayScores[i] ? 1 : 0), 0);
  const awaySetsWon = homeScores.reduce((acc, s, i) => acc + (s < awayScores[i] ? 1 : 0), 0);
  const homeBonusPoints = homeScores.reduce((t, s) => t + Math.floor(s / 10), 0);
  const awayBonusPoints = awayScores.reduce((t, s) => t + Math.floor(s / 10), 0);

  return {
    court_number: courtNumber,
    division,
    home_team_name: homeTeam,
    away_team_name: awayTeam,
    set1_home_score: homeScores[0] || 0,
    set1_away_score: awayScores[0] || 0,
    set2_home_score: homeScores[1] || 0,
    set2_away_score: awayScores[1] || 0,
    set3_home_score: homeScores[2] || 0,
    set3_away_score: awayScores[2] || 0,
    home_total_points: homeScores.reduce((a, b) => a + b, 0),
    away_total_points: awayScores.reduce((a, b) => a + b, 0),
    home_result: homeSetsWon > awaySetsWon ? 'W' : homeSetsWon < awaySetsWon ? 'L' : 'D',
    away_result: awaySetsWon > homeSetsWon ? 'W' : awaySetsWon < homeSetsWon ? 'L' : 'D',
    home_bonus_points: homeBonusPoints,
    away_bonus_points: awayBonusPoints,
    home_total_match_points: homeBonusPoints + (homeSetsWon * 2),
    away_total_match_points: awayBonusPoints + (awaySetsWon * 2),
    match_date: fixtureStartTime || new Date().toISOString(),
    fixture_start_time: fixtureStartTime || null,
    has_final_score: true,
    home_aces: aceBlockStats.homeAces || 0,
    away_aces: aceBlockStats.awayAces || 0,
    home_blocks: aceBlockStats.homeBlocks || 0,
    away_blocks: aceBlockStats.awayBlocks || 0,
  };
};

// ─── Direct Supabase save (non-blocking) ─────────────────────────────────────

const saveToSupabase = async (
  matchId: string,
  homeScores: number[],
  awayScores: number[],
  fixtureStartTime: string | undefined,
  homeTeam: string,
  awayTeam: string,
  aceBlockStats: { homeAces?: number; awayAces?: number; homeBlocks?: number; awayBlocks?: number }
): Promise<void> => {
  const isLocalMatchId = matchId.startsWith('local-') || matchId.startsWith('fallback-') || matchId.startsWith('default-');

  let courtNumber = 0;
  let division = 'Unknown';

  if (isLocalMatchId) {
    // Extract court number: prefer explicit "court-1" pattern, fall back to first number segment
    const courtMatch = matchId.match(/(?:court[_-]?)(\d+)/i) || matchId.match(/[^\d](\d+)/);
    courtNumber = courtMatch ? parseInt(courtMatch[1]) : 0;
    division = 'Local Match';
  } else {
    // Fetch match metadata from matches_v2
    const { data: matchData } = await supabase
      .from('matches_v2')
      .select('court_number, division, home_team_name, away_team_name, fixture_start_time')
      .eq('id', matchId)
      .maybeSingle();

    if (matchData) {
      courtNumber = matchData.court_number;
      division = matchData.division || 'Unknown';
      homeTeam = homeTeam || matchData.home_team_name;
      awayTeam = awayTeam || matchData.away_team_name;
      if (!fixtureStartTime && matchData.fixture_start_time) {
        fixtureStartTime = matchData.fixture_start_time;
      }
    }
  }

  const payload = buildUpsertPayload(
    matchId, homeScores, awayScores,
    courtNumber, division, homeTeam, awayTeam,
    fixtureStartTime, aceBlockStats
  );

  if (isLocalMatchId) {
    // Local matches: upsert on session_key (stable per match session, works even without fixture time)
    const { error } = await supabase
      .from('match_data_v2')
      .upsert(
        { ...payload, match_id: null, session_key: matchId },
        { onConflict: 'session_key', ignoreDuplicates: false }
      );
    if (error) throw error;
  } else {
    // Spawtz matches: upsert on court_number + fixture_start_time (match_id is UUID, local IDs are strings)
    if (!fixtureStartTime) {
      // No fixture time — just insert, don't upsert (can't deduplicate without a key)
      const { error } = await supabase
        .from('match_data_v2')
        .insert({ ...payload, session_key: matchId });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('match_data_v2')
        .upsert(
          { ...payload, session_key: matchId },
          { onConflict: 'court_number,fixture_start_time', ignoreDuplicates: false }
        );
      if (error) throw error;
    }
  }
};

// ─── Offline queue flush ──────────────────────────────────────────────────────

let isFlushing = false;

const flushPendingScores = async (): Promise<void> => {
  if (isFlushing || !navigator.onLine) return;
  isFlushing = true;
  try {
    const pending = await getPendingScores();
    for (const score of pending) {
      try {
        await saveToSupabase(
          score.matchId,
          score.homeScores,
          score.awayScores,
          score.fixture_start_time,
          score.homeTeam || 'Home Team',
          score.awayTeam || 'Away Team',
          {
            homeAces: score.homeAces,
            awayAces: score.awayAces,
            homeBlocks: score.homeBlocks,
            awayBlocks: score.awayBlocks,
          }
        );
        await removePendingScore(score.id);
        console.log('Flushed offline score:', score.id);
      } catch (err) {
        console.warn('Failed to flush score, will retry later:', score.id, err);
      }
    }
  } finally {
    isFlushing = false;
  }
};

// Flush when connection restores
window.addEventListener('online', () => {
  console.log('Back online — flushing pending scores');
  flushPendingScores().catch(console.error);
});

// Background flush every 5 min (catches anything missed)
setInterval(() => {
  if (navigator.onLine) flushPendingScores().catch(console.error);
}, 5 * 60 * 1000);

// ─── Main export ─────────────────────────────────────────────────────────────

export const saveMatchScores = async (
  matchId: string,
  homeScores: number[],
  awayScores: number[],
  _submitToSupabase: boolean = false, // kept for API compatibility, ignored
  fixtureTime?: string,
  fixture_start_time?: string,
  homeTeam?: string,
  awayTeam?: string,
  aceBlockStats?: {
    homeAces?: number;
    awayAces?: number;
    homeBlocks?: number;
    awayBlocks?: number;
  }
): Promise<void> => {
  if (!matchId || !homeScores.length || !awayScores.length) {
    console.error('saveMatchScores: invalid data', { matchId, homeScores, awayScores });
    return;
  }

  const fixtureStartTime = fixture_start_time || toISOFixtureTime(fixtureTime);
  const stats = aceBlockStats || {};

  if (navigator.onLine && !isOffline()) {
    // ── Online path: save directly to Supabase, non-blocking ──
    saveToSupabase(
      matchId, homeScores, awayScores,
      fixtureStartTime,
      homeTeam || 'Home Team',
      awayTeam || 'Away Team',
      stats
    ).then(() => {
      console.log('Saved to Supabase:', matchId, homeScores, awayScores);
    }).catch(async (err) => {
      console.error('Supabase save failed, queuing offline:', err);
      // Fall back to offline queue
      await savePendingScore({
        id: matchId,
        matchId,
        homeScores,
        awayScores,
        fixtureTime,
        fixture_start_time: fixtureStartTime,
        homeTeam,
        awayTeam,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        ...stats,
      });
    });
  } else {
    // ── Offline path: queue for later ──
    console.log('Offline — queuing score for later:', matchId);
    await savePendingScore({
      id: matchId,
      matchId,
      homeScores,
      awayScores,
      fixtureTime,
      fixture_start_time: fixtureStartTime,
      homeTeam,
      awayTeam,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      ...stats,
    });
  }
};

export { flushPendingScores as processPendingScores };
