import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Meeting, Note, ActionItem } from '../types';

export const exportService = {
  // Export meeting notes as Markdown
  exportToMarkdown(meeting: Meeting, note: Note, actionItems: ActionItem[]) {
    let markdown = `# ${meeting.title}\n\n`;
    markdown += `**Date:** ${format(new Date(meeting.startTime), 'MMMM d, yyyy')}\n`;
    markdown += `**Time:** ${format(new Date(meeting.startTime), 'h:mm a')}`;
    
    if (meeting.endTime) {
      markdown += ` - ${format(new Date(meeting.endTime), 'h:mm a')}`;
    }
    markdown += '\n\n';

    if (note.summary) {
      markdown += `## Summary\n\n${note.summary}\n\n`;
    }

    if (note.enhancedNotes) {
      markdown += `## Notes\n\n${note.enhancedNotes}\n\n`;
    }

    if (actionItems.length > 0) {
      markdown += `## Action Items\n\n`;
      actionItems.forEach(item => {
        markdown += `- [ ] ${item.description}`;
        if (item.dueDate) {
          markdown += ` (Due: ${format(new Date(item.dueDate), 'MMM d, yyyy')})`;
        }
        markdown += '\n';
      });
      markdown += '\n';
    }

    if (note.rawTranscript) {
      markdown += `## Transcript\n\n${note.rawTranscript}\n`;
    }

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const filename = `${meeting.title.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(meeting.startTime), 'yyyy-MM-dd')}.md`;
    saveAs(blob, filename);
  },

  // Export meeting notes as PDF
  async exportToPDF(meeting: Meeting, note: Note, actionItems: ActionItem[]) {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(meeting.title, maxWidth);
    pdf.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 8 + 5;

    // Date and Time
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${format(new Date(meeting.startTime), 'MMMM d, yyyy')}`, margin, yPosition);
    yPosition += 7;
    
    let timeText = `Time: ${format(new Date(meeting.startTime), 'h:mm a')}`;
    if (meeting.endTime) {
      timeText += ` - ${format(new Date(meeting.endTime), 'h:mm a')}`;
    }
    pdf.text(timeText, margin, yPosition);
    yPosition += 15;

    // Summary
    if (note.summary) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary', margin, yPosition);
      yPosition += 7;
      
      pdf.setFont('helvetica', 'normal');
      const summaryLines = pdf.splitTextToSize(note.summary, maxWidth);
      pdf.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * 5 + 10;
    }

    // Check if we need a new page
    const checkNewPage = (additionalHeight: number) => {
      if (yPosition + additionalHeight > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = margin;
      }
    };

    // Enhanced Notes
    if (note.enhancedNotes) {
      checkNewPage(50);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Notes', margin, yPosition);
      yPosition += 7;
      
      pdf.setFont('helvetica', 'normal');
      // Convert markdown to plain text for PDF
      const plainNotes = note.enhancedNotes
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/- /g, '• '); // Convert dashes to bullets
      
      const notesLines = pdf.splitTextToSize(plainNotes, maxWidth);
      
      // Add notes line by line, checking for page breaks
      for (const line of notesLines) {
        checkNewPage(5);
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      }
      yPosition += 10;
    }

    // Action Items
    if (actionItems.length > 0) {
      checkNewPage(30);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Action Items', margin, yPosition);
      yPosition += 7;
      
      pdf.setFont('helvetica', 'normal');
      actionItems.forEach(item => {
        checkNewPage(10);
        
        let itemText = `• ${item.description}`;
        if (item.dueDate) {
          itemText += ` (Due: ${format(new Date(item.dueDate), 'MMM d, yyyy')})`;
        }
        
        const itemLines = pdf.splitTextToSize(itemText, maxWidth);
        pdf.text(itemLines, margin, yPosition);
        yPosition += itemLines.length * 5 + 2;
      });
    }

    // Save the PDF
    const filename = `${meeting.title.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(meeting.startTime), 'yyyy-MM-dd')}.pdf`;
    pdf.save(filename);
  },

  // Export multiple meetings
  async exportMultipleMeetings(meetings: Meeting[], notes: Note[], actionItems: ActionItem[], exportFormat: 'markdown' | 'pdf') {
    if (exportFormat === 'markdown') {
      let markdown = '# Meeting Notes Export\n\n';
      markdown += `Generated on ${format(new Date(), 'MMMM d, yyyy')}\n\n---\n\n`;

      meetings.forEach(meeting => {
        const note = notes.find(n => n.meetingId === meeting.id);
        const meetingActionItems = actionItems.filter(a => a.meetingId === meeting.id);
        
        if (note) {
          markdown += `## ${meeting.title}\n\n`;
          markdown += `**Date:** ${format(new Date(meeting.startTime), 'MMMM d, yyyy')}\n\n`;
          
          if (note.summary) {
            markdown += `### Summary\n${note.summary}\n\n`;
          }
          
          if (meetingActionItems.length > 0) {
            markdown += `### Action Items\n`;
            meetingActionItems.forEach(item => {
              markdown += `- [ ] ${item.description}\n`;
            });
            markdown += '\n';
          }
          
          markdown += '---\n\n';
        }
      });

      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, `meeting_notes_export_${format(new Date(), 'yyyy-MM-dd')}.md`);
    } else {
      // For PDF, create a summary document
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text('Meeting Notes Summary', 20, 20);
      pdf.setFontSize(10);
      pdf.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, 20, 30);
      
      // Add a simple list of meetings
      let yPos = 50;
      meetings.forEach(meeting => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(12);
        pdf.text(`• ${meeting.title} - ${format(new Date(meeting.startTime), 'MMM d')}`, 20, yPos);
        yPos += 10;
      });
      
      pdf.save(`meeting_summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    }
  }
};