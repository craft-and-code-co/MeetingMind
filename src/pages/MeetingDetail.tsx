import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  SparklesIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { openAIService } from '../services/openai';
import { ActionItem } from '../types';

export const MeetingDetail: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { 
    meetings, 
    notes, 
    actionItems,
    addNote, 
    updateNote, 
    addActionItem,
    updateActionItem,
    getNotesByMeetingId 
  } = useStore();

  const meeting = meetings.find(m => m.id === meetingId);
  const existingNote = getNotesByMeetingId(meetingId || '');
  
  const [rawTranscript, setRawTranscript] = useState(existingNote?.rawTranscript || '');
  const [enhancedNotes, setEnhancedNotes] = useState(existingNote?.enhancedNotes || '');
  const [summary, setSummary] = useState(existingNote?.summary || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [newActionItem, setNewActionItem] = useState('');

  const meetingActionItems = actionItems.filter(item => item.meetingId === meetingId);

  useEffect(() => {
    if (existingNote) {
      setRawTranscript(existingNote.rawTranscript);
      setEnhancedNotes(existingNote.enhancedNotes);
      setSummary(existingNote.summary);
    }
  }, [existingNote]);

  const handleEnhanceNotes = async () => {
    if (!rawTranscript.trim()) {
      alert('Please add a transcript first');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await openAIService.enhanceNotes(rawTranscript);
      
      setEnhancedNotes(result.enhancedNotes);
      setSummary(result.summary);

      // Save or update note
      const noteData = {
        id: existingNote?.id || Date.now().toString(),
        meetingId: meetingId!,
        rawTranscript,
        enhancedNotes: result.enhancedNotes,
        summary: result.summary,
        actionItems: result.actionItems,
        createdAt: existingNote?.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (existingNote) {
        updateNote(existingNote.id, noteData);
      } else {
        addNote(noteData);
      }

      // Add action items
      result.actionItems.forEach((item, index) => {
        const actionItem: ActionItem = {
          id: `${meetingId}-ai-${Date.now()}-${index}`,
          meetingId: meetingId!,
          date: meeting?.date || format(new Date(), 'yyyy-MM-dd'),
          description: item.description || '',
          status: 'pending',
          dueDate: item.dueDate,
          createdAt: new Date()
        };
        addActionItem(actionItem);
      });

      alert('Notes enhanced successfully!');
    } catch (error) {
      console.error('Failed to enhance notes:', error);
      alert('Failed to enhance notes. Please check your API key and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveTranscript = () => {
    const noteData = {
      id: existingNote?.id || Date.now().toString(),
      meetingId: meetingId!,
      rawTranscript,
      enhancedNotes,
      summary,
      actionItems: [],
      createdAt: existingNote?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (existingNote) {
      updateNote(existingNote.id, noteData);
    } else {
      addNote(noteData);
    }
    
    setEditingTranscript(false);
    alert('Transcript saved!');
  };

  const handleAddActionItem = () => {
    if (!newActionItem.trim()) return;

    const actionItem: ActionItem = {
      id: `${meetingId}-manual-${Date.now()}`,
      meetingId: meetingId!,
      date: meeting?.date || format(new Date(), 'yyyy-MM-dd'),
      description: newActionItem,
      status: 'pending',
      createdAt: new Date()
    };

    addActionItem(actionItem);
    setNewActionItem('');
  };

  const handleDeleteActionItem = (itemId: string) => {
    // In a real app, you'd add a deleteActionItem method to the store
    // For now, we'll just mark it as completed
    updateActionItem(itemId, { status: 'completed' });
  };

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Meeting not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
                <p className="text-sm text-gray-500">
                  {format(new Date(meeting.startTime), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transcript Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Meeting Transcript
                </h2>
                {!editingTranscript && (
                  <button
                    onClick={() => setEditingTranscript(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="p-6">
                {editingTranscript ? (
                  <div>
                    <textarea
                      value={rawTranscript}
                      onChange={(e) => setRawTranscript(e.target.value)}
                      placeholder="Paste your meeting transcript here..."
                      className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingTranscript(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTranscript}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {rawTranscript ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{rawTranscript}</p>
                    ) : (
                      <p className="text-gray-500 italic">
                        No transcript yet. Click Edit to add one.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Notes Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Enhanced Notes
                </h2>
                <button
                  onClick={handleEnhanceNotes}
                  disabled={isProcessing || !rawTranscript}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Enhance with AI'}
                </button>
              </div>
              <div className="p-6">
                {summary && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Summary</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{summary}</p>
                  </div>
                )}
                {enhancedNotes ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Key Points</h3>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {enhancedNotes}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    Click "Enhance with AI" to generate structured notes and action items.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Action Items */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Action Items
                </h2>
              </div>
              <div className="p-6">
                {/* Add new action item */}
                <div className="mb-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newActionItem}
                      onChange={(e) => setNewActionItem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddActionItem()}
                      placeholder="Add action item..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={handleAddActionItem}
                      className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Action items list */}
                <div className="space-y-2">
                  {meetingActionItems.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No action items yet
                    </p>
                  ) : (
                    meetingActionItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-md"
                      >
                        <button
                          onClick={() => updateActionItem(item.id, {
                            status: item.status === 'completed' ? 'pending' : 'completed'
                          })}
                          className={`mt-0.5 ${
                            item.status === 'completed'
                              ? 'text-green-600'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                        <p className={`flex-1 text-sm ${
                          item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};