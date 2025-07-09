import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  SparklesIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { openAIService } from '../services/openai';
import { exportService } from '../services/export';
import { ActionItem, Reminder, Note } from '../types';
import { MarkdownViewer } from '../components/MarkdownViewer';

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
    getNotesByMeetingId,
    updateMeeting,
    deleteMeeting,
    addReminder
  } = useStore();

  const meeting = meetings.find(m => m.id === meetingId);
  const existingNote = getNotesByMeetingId(meetingId || '');
  
  const [rawTranscript, setRawTranscript] = useState(existingNote?.rawTranscript || '');
  const [enhancedNotes, setEnhancedNotes] = useState(existingNote?.enhancedNotes || '');
  const [summary, setSummary] = useState(existingNote?.summary || '');
  const [highlights, setHighlights] = useState<Array<{type: string; text: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [showTitleGenerator, setShowTitleGenerator] = useState(false);
  const [titleStyle, setTitleStyle] = useState<'professional' | 'descriptive' | 'creative' | 'emoji'>('professional');
  const [newActionItem, setNewActionItem] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const meetingActionItems = actionItems.filter(item => item.meetingId === meetingId);

  useEffect(() => {
    if (existingNote) {
      setRawTranscript(existingNote.rawTranscript);
      setEnhancedNotes(existingNote.enhancedNotes);
      setSummary(existingNote.summary);
    }
  }, [existingNote]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

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
      setHighlights(result.highlights || []);

      // Save or update note
      const noteData: Note = {
        id: existingNote?.id || Date.now().toString(),
        meetingId: meetingId!,
        rawTranscript,
        enhancedNotes: result.enhancedNotes,
        summary: result.summary,
        actionItems: [],
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

      // Extract and create reminders
      try {
        const reminders = await openAIService.extractReminders(rawTranscript, result.actionItems);
        reminders.forEach((reminderData, index) => {
          const dueDate = new Date(reminderData.dueDate);
          const reminderDate = new Date(dueDate.getTime() - reminderData.reminderOffset * 60 * 60 * 1000);
          
          const reminder: Reminder = {
            id: `${meetingId}-reminder-${Date.now()}-${index}`,
            meetingId: meetingId!,
            title: reminderData.title,
            description: reminderData.description,
            dueDate: reminderData.dueDate,
            reminderDate: reminderDate.toISOString(),
            status: 'pending',
            priority: reminderData.priority,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          addReminder(reminder);
        });
        
        if (reminders.length > 0) {
          alert(`Notes enhanced successfully! Created ${reminders.length} smart reminders.`);
        } else {
          alert('Notes enhanced successfully!');
        }
      } catch (error) {
        console.error('Failed to extract reminders:', error);
        alert('Notes enhanced successfully, but failed to create reminders.');
      }
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

  const handleGenerateTitle = async () => {
    if (!rawTranscript) {
      alert('Please add a transcript first');
      return;
    }

    setIsProcessing(true);
    try {
      const newTitle = await openAIService.generateMeetingTitle(rawTranscript, titleStyle);
      if (meeting) {
        updateMeeting(meeting.id, { title: newTitle });
      }
      setShowTitleGenerator(false);
    } catch (error) {
      console.error('Failed to generate title:', error);
      alert('Failed to generate title');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMeeting = () => {
    if (window.confirm('Are you sure you want to delete this meeting? This will also delete all notes, action items, and reminders associated with it.')) {
      deleteMeeting(meeting!.id);
      navigate('/dashboard');
    }
  };

  const handleExportMarkdown = () => {
    if (!existingNote) {
      alert('No notes to export');
      return;
    }
    exportService.exportToMarkdown(meeting!, existingNote, meetingActionItems);
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    if (!existingNote) {
      alert('No notes to export');
      return;
    }
    await exportService.exportToPDF(meeting!, existingNote, meetingActionItems);
    setShowExportMenu(false);
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
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
                  <button
                    onClick={() => setShowTitleGenerator(!showTitleGenerator)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Generate AI title"
                  >
                    <SparklesIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  {format(new Date(meeting.startTime), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Export Button */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
                  title="Export meeting"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu">
                      <button
                        onClick={handleExportMarkdown}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Export as Markdown
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Delete Button */}
              <button
                onClick={handleDeleteMeeting}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                title="Delete meeting"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Generator */}
        {showTitleGenerator && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Generate New Title</h3>
            <div className="flex items-center space-x-3">
              <select
                value={titleStyle}
                onChange={(e) => setTitleStyle(e.target.value as any)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="professional">Professional</option>
                <option value="descriptive">Descriptive</option>
                <option value="creative">Creative</option>
                <option value="emoji">With Emoji</option>
              </select>
              <button
                onClick={handleGenerateTitle}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isProcessing ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={() => setShowTitleGenerator(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
                <div className="flex items-center space-x-2">
                  {enhancedNotes && !editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={handleEnhanceNotes}
                    disabled={isProcessing || !rawTranscript}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Enhance with AI'}
                  </button>
                </div>
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
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">Key Points</h3>
                      {highlights.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {highlights.length} highlights
                        </span>
                      )}
                    </div>
                    {editingNotes ? (
                      <div>
                        <textarea
                          value={enhancedNotes}
                          onChange={(e) => setEnhancedNotes(e.target.value)}
                          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                          placeholder="Write your notes in Markdown..."
                        />
                        <div className="mt-4 flex justify-end space-x-3">
                          <button
                            onClick={() => setEditingNotes(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              // Save the edited notes
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
                              setEditingNotes(false);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <MarkdownViewer 
                        content={enhancedNotes} 
                        highlights={highlights}
                        className="bg-gray-50 p-4 rounded-md"
                      />
                    )}
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