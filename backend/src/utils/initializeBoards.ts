import { supabase } from '../database/supabase';
import { UNIVERSITY_BOARDS } from '../config/boards.config';

export async function initializeJobBoards() {
  console.log('Initializing job boards...');

  try {
    // Check if boards already exist
    const { data: existingBoards, error: fetchError } = await supabase
      .from('job_boards')
      .select('id')
      .in('id', UNIVERSITY_BOARDS.map(b => b.id));

    if (fetchError) {
      console.error('Error fetching existing boards:', fetchError);
      return;
    }

    const existingIds = new Set((existingBoards || []).map(b => b.id));
    const boardsToCreate = UNIVERSITY_BOARDS.filter(b => !existingIds.has(b.id));

    if (boardsToCreate.length === 0) {
      console.log('All boards already exist');
      return;
    }

    // Insert missing boards with minimal fields
    const boardRecords = boardsToCreate.map(board => ({
      id: board.id,
      name: board.name,
      base_url: `https://${board.code}.edu/careers`,
      post_url: `https://${board.code}.edu/careers`,
      selectors: {},
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('job_boards')
      .insert(boardRecords);

    if (insertError) {
      console.error('Error inserting job boards:', insertError);
    } else {
      console.log(`Successfully created ${boardsToCreate.length} job boards`);
    }
  } catch (error) {
    console.error('Failed to initialize job boards:', error);
  }
}