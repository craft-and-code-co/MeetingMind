import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const { meetings, notes, actionItems } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'meetings' | 'notes' | 'actions'>('all');

  // Perform search across all content
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return { meetings: [], notes: [], actionItems: [] };
    }

    const query = searchQuery.toLowerCase();
    
    // Search meetings
    const matchedMeetings = searchFilter === 'all' || searchFilter === 'meetings' 
      ? meetings.filter(meeting => 
          meeting.title.toLowerCase().includes(query) ||
          meeting.participants.some(p => p.toLowerCase().includes(query))
        )
      : [];

    // Search notes
    const matchedNotes = searchFilter === 'all' || searchFilter === 'notes'
      ? notes.filter(note => {
          const meeting = meetings.find(m => m.id === note.meetingId);
          return (
            note.rawTranscript.toLowerCase().includes(query) ||
            note.enhancedNotes.toLowerCase().includes(query) ||
            note.summary.toLowerCase().includes(query) ||
            meeting?.title.toLowerCase().includes(query)
          );
        })
      : [];

    // Search action items
    const matchedActionItems = searchFilter === 'all' || searchFilter === 'actions'
      ? actionItems.filter(item => 
          item.description.toLowerCase().includes(query)
        )
      : [];

    return {
      meetings: matchedMeetings,
      notes: matchedNotes,
      actionItems: matchedActionItems
    };
  }, [searchQuery, searchFilter, meetings, notes, actionItems]);

  const totalResults = 
    searchResults.meetings.length + 
    searchResults.notes.length + 
    searchResults.actionItems.length;

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200">{part}</mark>
        : part
    );
  };

  return (
    <div className="max-w-none mx-auto px-6 py-6">
        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meetings, notes, and action items..."
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => setSearchFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  searchFilter === 'all'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSearchFilter('meetings')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  searchFilter === 'meetings'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                Meetings
              </button>
              <button
                onClick={() => setSearchFilter('notes')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  searchFilter === 'notes'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setSearchFilter('actions')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  searchFilter === 'actions'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                Action Items
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {!searchQuery ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Search your meetings</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              Find anything across all your meetings, notes, and action items. Try searching for topics, participants, or keywords.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">Popular searches:</span>
              {['next steps', 'decisions', 'action items', 'follow up'].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {totalResults === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 dark:text-slate-500" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No results found</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  We couldn't find anything matching "{searchQuery}". Try different keywords or check your filters.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchFilter('all');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear search
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Meeting Results */}
                {searchResults.meetings.length > 0 && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        Meetings ({searchResults.meetings.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {searchResults.meetings.map(meeting => (
                        <div
                          key={meeting.id}
                          onClick={() => navigate(`/meeting/${meeting.id}`)}
                          className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                        >
                          <h3 className="text-sm font-medium text-gray-900">
                            {highlightText(meeting.title, searchQuery)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {format(new Date(meeting.startTime), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note Results */}
                {searchResults.notes.length > 0 && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Notes ({searchResults.notes.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {searchResults.notes.map(note => {
                        const meeting = meetings.find(m => m.id === note.meetingId);
                        const excerpt = note.summary || note.enhancedNotes.substring(0, 150) + '...';
                        
                        return (
                          <div
                            key={note.id}
                            onClick={() => navigate(`/meeting/${note.meetingId}`)}
                            className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                          >
                            <h3 className="text-sm font-medium text-gray-900">
                              {meeting?.title || 'Unknown Meeting'}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {highlightText(excerpt, searchQuery)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(note.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Item Results */}
                {searchResults.actionItems.length > 0 && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Action Items ({searchResults.actionItems.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {searchResults.actionItems.map(item => {
                        const meeting = meetings.find(m => m.id === item.meetingId);
                        
                        return (
                          <div
                            key={item.id}
                            onClick={() => navigate(`/meeting/${item.meetingId}`)}
                            className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-start">
                              <CheckCircleIcon 
                                className={`h-5 w-5 mr-3 mt-0.5 ${
                                  item.status === 'completed' 
                                    ? 'text-green-600' 
                                    : 'text-gray-400'
                                }`} 
                              />
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">
                                  {highlightText(item.description, searchQuery)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                  From: {meeting?.title || 'Unknown Meeting'}
                                  {item.dueDate && ` • Due: ${format(new Date(item.dueDate), 'MMM d')}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
    </div>
  );
};