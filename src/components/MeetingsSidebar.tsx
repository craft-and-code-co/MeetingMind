import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderPlusIcon, 
  DocumentTextIcon, 
  ChevronRightIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { Folder } from '../types';
import { format } from 'date-fns';

interface MeetingsSidebarProps {
  onCreateFolder: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveMeeting: (meetingId: string, folderId: string | undefined) => void;
  onDeleteMeeting: (meetingId: string) => void;
}

export const MeetingsSidebar: React.FC<MeetingsSidebarProps> = ({
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveMeeting,
  onDeleteMeeting,
}) => {
  const navigate = useNavigate();
  const { folders, meetings, updateMeeting } = useStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Group meetings by folder
  const unfolderMeetings = meetings.filter(m => !m.folderId);
  const folderMeetings = folders.reduce((acc, folder) => {
    acc[folder.id] = meetings.filter(m => m.folderId === folder.id);
    return acc;
  }, {} as Record<string, typeof meetings>);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleStartEditing = (meetingId: string, currentTitle: string) => {
    setEditingMeetingId(meetingId);
    setEditingName(currentTitle);
  };

  const handleSaveEdit = () => {
    if (editingMeetingId && editingName.trim()) {
      updateMeeting(editingMeetingId, { title: editingName.trim() });
    }
    setEditingMeetingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingMeetingId(null);
    setEditingName('');
  };


  const renderMeeting = (meeting: typeof meetings[0]) => {
    const isEditing = editingMeetingId === meeting.id;
    
    return (
      <div
        key={meeting.id}
        className="flex items-center px-3 py-3 text-sm rounded-lg transition-colors group text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white hover:shadow-sm dark:hover:shadow-none"
      >
        <DocumentTextIcon className="h-4 w-4 mr-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="w-full px-2 py-1 text-sm rounded border bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <div
              onClick={() => navigate(`/meeting/${meeting.id}`)}
              className="cursor-pointer"
            >
              <div className="truncate">{meeting.title}</div>
              <div className="text-xs text-gray-500 dark:text-slate-500">
                {format(meeting.startTime, 'MMM d, yyyy')}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded"
              >
                <CheckIcon className="h-3 w-3" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 rounded"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEditing(meeting.id, meeting.title);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-600 rounded"
              >
                <PencilIcon className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`)) {
                    onDeleteMeeting(meeting.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  meeting.isRecording
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}
              >
                {meeting.isRecording ? 'Recording' : 'Done'}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 h-screen border-r bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Meetings
          </h2>
          <button
            onClick={onCreateFolder}
            className="p-1 rounded-md transition-colors text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
            title="Create new folder"
          >
            <FolderPlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Folders and Meetings */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {/* Unfoldered Meetings */}
        {unfolderMeetings.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700 dark:text-slate-300 px-2">
              Recent Meetings
            </div>
            {unfolderMeetings.map(renderMeeting)}
          </div>
        )}

        {/* Folders */}
        {folders.map(folder => (
          <div key={folder.id} className="space-y-1">
            <div className="flex items-center justify-between group">
              <button
                onClick={() => toggleFolder(folder.id)}
                className="flex items-center flex-1 px-2 py-1 text-sm font-medium rounded-md transition-colors text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
              >
                {expandedFolders.has(folder.id) ? (
                  <ChevronDownIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 mr-1" />
                )}
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="truncate">{folder.name}</span>
                <span className="ml-2 text-xs text-gray-500 dark:text-slate-500">
                  ({folderMeetings[folder.id]?.length || 0})
                </span>
              </button>
              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                <button
                  onClick={() => onEditFolder(folder)}
                  className="p-1 rounded transition-colors text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                  title="Edit folder"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onDeleteFolder(folder.id)}
                  className="p-1 rounded transition-colors text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                  title="Delete folder"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            </div>
            {expandedFolders.has(folder.id) && (
              <div className="ml-4 space-y-1">
                {folderMeetings[folder.id]?.map(renderMeeting)}
                {(!folderMeetings[folder.id] || folderMeetings[folder.id].length === 0) && (
                  <div className="text-xs text-gray-500 dark:text-slate-500 px-2 py-1">
                    No meetings in this folder
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};