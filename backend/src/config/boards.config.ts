// University board configuration
// Maps board identifiers to UUIDs for database storage

export const UNIVERSITY_BOARDS = [
  { id: 'a4637fde-e352-491d-aad9-700a2b07156b', code: 'harvard', name: 'Harvard University', location: 'Cambridge, MA' },
  { id: 'ae2272d8-3249-4997-9259-ca3dc71fdce1', code: 'mit', name: 'MIT', location: 'Cambridge, MA' },
  { id: 'f225fb8c-26f6-4244-8764-bbd063923356', code: 'stanford', name: 'Stanford University', location: 'Stanford, CA' },
  { id: '692fa28e-d7dc-41b5-9989-ea45cc1c5999', code: 'yale', name: 'Yale University', location: 'New Haven, CT' },
  { id: '301657f5-c95d-45af-a031-089cb4f8eff9', code: 'princeton', name: 'Princeton University', location: 'Princeton, NJ' }
];

// Helper function to get UUID from board code
export function getBoardUUID(boardCode: string): string | null {
  const board = UNIVERSITY_BOARDS.find(b => b.code === boardCode);
  return board ? board.id : null;
}

// Helper function to get board info from UUID
export function getBoardInfo(boardId: string) {
  return UNIVERSITY_BOARDS.find(b => b.id === boardId);
}