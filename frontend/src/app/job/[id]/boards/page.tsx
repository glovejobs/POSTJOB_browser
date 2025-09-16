'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Check, ChevronRight, School, DollarSign } from 'lucide-react';
import { BRAND_CONFIG } from '../../../../../../shared/constants';
import { jobs } from '@/lib/api';

const UNIVERSITY_BOARDS = [
  { id: 'harvard', name: 'Harvard University', logo: '🎓', students: '23,000+', location: 'Cambridge, MA' },
  { id: 'mit', name: 'MIT', logo: '🏛️', students: '11,000+', location: 'Cambridge, MA' },
  { id: 'stanford', name: 'Stanford University', logo: '🌲', students: '17,000+', location: 'Stanford, CA' },
  { id: 'yale', name: 'Yale University', logo: '🏰', students: '13,000+', location: 'New Haven, CT' },
  { id: 'princeton', name: 'Princeton University', logo: '🐯', students: '8,000+', location: 'Princeton, NJ' },
  { id: 'columbia', name: 'Columbia University', logo: '🦁', students: '33,000+', location: 'New York, NY' },
  { id: 'upenn', name: 'University of Pennsylvania', logo: '🏛️', students: '25,000+', location: 'Philadelphia, PA' },
  { id: 'cornell', name: 'Cornell University', logo: '🐻', students: '24,000+', location: 'Ithaca, NY' },
];

export default function BoardSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { colors, typography, shadows } = BRAND_CONFIG;

  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const job = await jobs.get(jobId);
      setJobDetails(job);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    }
  };

  const handleBoardToggle = (boardId: string) => {
    setSelectedBoards(prev =>
      prev.includes(boardId)
        ? prev.filter(id => id !== boardId)
        : [...prev, boardId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBoards.length === UNIVERSITY_BOARDS.length) {
      setSelectedBoards([]);
    } else {
      setSelectedBoards(UNIVERSITY_BOARDS.map(b => b.id));
    }
  };

  const handleContinue = async () => {
    if (selectedBoards.length === 0) {
      alert('Please select at least one job board');
      return;
    }

    setLoading(true);
    try {
      // Update job with selected boards
      await jobs.update(jobId, {
        postings: selectedBoards.map(boardId => ({
          board_id: boardId,
          status: 'pending'
        }))
      });

      // Navigate to payment page
      router.push(`/payment?jobId=${jobId}`);
    } catch (error) {
      console.error('Failed to update job:', error);
      alert('Failed to save board selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = selectedBoards.length * 2.99;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.surface, fontFamily: typography.fontFamily.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4"
              style={{ borderColor: colors.border }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/job/${jobId}`)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: colors.textSecondary }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>
                Select Job Boards
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Choose where to post your job listing
              </p>
            </div>
          </div>

          {/* Price Display */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg"
               style={{ backgroundColor: colors.primaryLight + '10' }}>
            <DollarSign size={20} style={{ color: colors.primary }} />
            <div>
              <p className="text-sm font-medium" style={{ color: colors.primary }}>
                ${totalCost.toFixed(2)} total
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                $2.99 per board
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        {/* Job Summary */}
        {jobDetails && (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                  {jobDetails.title}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {jobDetails.company} • {jobDetails.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {selectedBoards.length} boards selected
                </p>
                <p className="font-semibold" style={{ color: colors.primary }}>
                  ${totalCost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Select All */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Available University Boards
          </h2>
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: colors.border, color: colors.textPrimary }}
          >
            {selectedBoards.length === UNIVERSITY_BOARDS.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {UNIVERSITY_BOARDS.map(board => {
            const isSelected = selectedBoards.includes(board.id);

            return (
              <div
                key={board.id}
                onClick={() => handleBoardToggle(board.id)}
                className="card cursor-pointer transition-all duration-200 hover:shadow-lg"
                style={{
                  borderWidth: '2px',
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primaryLight + '05' : 'white'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                         style={{ backgroundColor: colors.surface }}>
                      {board.logo}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                        {board.name}
                      </h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {board.location} • {board.students} students
                      </p>
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}
                  style={{
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : 'white'
                  }}>
                    {isSelected && <Check size={16} className="text-white" />}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t"
                     style={{ borderColor: colors.border }}>
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    Reach top talent
                  </span>
                  <span className="text-sm font-medium" style={{ color: colors.primary }}>
                    $2.99
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="card" style={{ backgroundColor: colors.primaryLight + '05' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
              Order Summary
            </h3>
            <School size={20} style={{ color: colors.primary }} />
          </div>

          <div className="space-y-2 mb-4">
            {selectedBoards.map(boardId => {
              const board = UNIVERSITY_BOARDS.find(b => b.id === boardId);
              if (!board) return null;

              return (
                <div key={boardId} className="flex items-center justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>
                    {board.name}
                  </span>
                  <span style={{ color: colors.textPrimary }}>$2.99</span>
                </div>
              );
            })}
          </div>

          {selectedBoards.length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  Total ({selectedBoards.length} boards)
                </span>
                <span className="text-xl font-bold" style={{ color: colors.primary }}>
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => router.push(`/job/${jobId}`)}
            className="px-6 py-3 rounded-lg border font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: colors.border, color: colors.textSecondary }}
          >
            Back to Job Details
          </button>

          <button
            onClick={handleContinue}
            disabled={selectedBoards.length === 0 || loading}
            className="px-8 py-3 rounded-lg font-medium text-white transition-all transform hover:scale-105 flex items-center gap-2"
            style={{
              background: selectedBoards.length > 0
                ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                : colors.lightGray,
              cursor: selectedBoards.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
            <ChevronRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}