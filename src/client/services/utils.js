export function formatDate(date, format) {
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

export function formatTime(time, format) {
  if (!time || !(time instanceof Date) || isNaN(time)) {
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
