/**
 * notifications.ts: Logic for sending email notifications to Approvers.
 */

/**
 * Triggered when a new request is added.
 * This function can be called directly by AppSheet via "Call a Script" automation.
 * @param {Object} request The raw row data from AppSheet.
 */
function sendNewRequestNotification(request: RawTranslationRequest | RawInterpretationRequest): void {
  try {
    Logger.log('Processing new request notification for: ' + JSON.stringify(request));

    let finalRecipients = Config.NotificationTestEmail;

    Logger.log('Config properties: ' + Config);
    if (Config.DevMode) {
      Logger.log('DevMode is ON. Redirecting all notifications to: ' + Config.NotificationTestEmail);
    } else {
      if (!request.school) {
        console.error('Notification failed: No school specified in request.');
        return;
      }

      // 2. Find Approvers for this school
      const allUsers = getUsersFromAppSheet();
      const schoolApprovers = allUsers.filter(
        (user) => user.role === 'Approver' && user.schools.includes(request.school)
      );

      // Also include Admins if you want, but the requirement specifically said "users with the Approver role"
      // I'll stick to the requirements.

      if (schoolApprovers.length === 0) {
        Logger.log(`No approvers found for school: ${request.school}. Skipping email.`);
        // Optional: notify admin if no approver exists?
        return;
      }

      const recipientEmails = schoolApprovers.map((u) => u.email);

      // 3. Determine final recipients based on DevMode
      finalRecipients = recipientEmails.join(', ');
    }

    // 4. Prepare HTML Content
    const template = HtmlService.createTemplateFromFile('notification-template');
    template.requesterName = request.name || 'Unknown Requester';
    template.requesterEmail = request.email || '';
    template.school = request.school;
    template.requestType = request.reqType;
    template.dateNeeded = request.requestDate;
    template.description = request.description;
    template.status = request.status;
    template.appUrl = ScriptApp.getService().getUrl();

    const htmlBody = template.evaluate().getContent();
    const subject = `New Translation Request: ${request.reqType} - ${request.school}`;

    // 5. Send Email
    MailApp.sendEmail({
      to: finalRecipients,
      subject: subject,
      htmlBody: htmlBody,
    });

    Logger.log(`Notification sent successfully to: ${finalRecipients}`);
  } catch (error) {
    console.error('Error in sendNewRequestNotification:', error);
    // Do not throw if called from automation to avoid breaking the AppSheet workflow,
    // unless you want the automation to show a failure.
  }
}

/**
 * Manual test function for notifications.
 */
function testNotification() {
  const mockRow = {
    ID: 'TEST-123',
    'Requester Email': 'test@example.com',
    'Requester Name': 'Testy McTestface',
    School: 'Walpole High School', // Ensure this matches a school in your system
    Status: 'Needs Approval',
    'Request Type': 'Interpretation',
    'Date Needed': '2026-06-01',
    Description: 'This is a test notification from the development system.',
  };

  sendNewRequestNotification(mapAppSheetRequest(mockRow));
}
