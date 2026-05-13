export function formatDate(date: any, format?: string): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  try {
    switch (format) {
      case 'MM/DD/YYYY':
        return date.toLocaleDateString('en-US');
      case 'MMM D, YYYY':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
}

export function formatTime(time: any, format?: string): string {
  if (!time || !(time instanceof Date) || isNaN(time.getTime())) {
    return '';
  }

  try {
    console.log('Formatting time:', time, format);
    switch (format) {
      case 'h:mm A':
        return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      default:
        return time.toLocaleTimeString();
    }
  } catch (error) {
    console.warn('Error formatting time:', error);
    return '';
  }
}
