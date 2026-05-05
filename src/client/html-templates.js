export function emptyRowTemplate() {
  return `<div class="empty-state">Select a request row to view details here.</div>`;
}

export function emptyDetailsTemplate() {
  return `<div class="empty-state">No request selected.</div>`;
}

export function tableRowTemplate(request, formattedData) { 
  return `<tr data-id="${request.id}" class="${formattedData.isActive ? 'active' : 'inactive'}">
    <td><span class="badge ${formattedData.statusBadge}">${request.status}</span></td>
    <td>${formattedData.requestDate}</td>
    <td>${formattedData.submittedDate}</td>
    <td>${request.reqType}</td>
    <td>${request.name}</td>
  </tr>`
}

export function detailsInterpretationTemplate(request, formattedData) {
  return `
    <div class="detail-item">
      <label>Request ID ${request.id}</label>
    </div>
    <div class="detail-item">
      <label>Languages</label>
      <div class="detail-value">${request.originalLanguage} to ${request.targetLanguage}</div>
    </div>
    <div class="detail-item">
      <label>Event Details</label>
    <div class="detail-value">${formattedData.requestDate}, 
      ${formattedData.startTime}-${formattedData.endTime}
    </div>
    <div class="detail-value">${request.eventLocation}</div>
    </div>
    <div class="detail-item">
      <label>Details</label>
      <div class="detail-value">${request.description}</div>
    </div>`;
  }
  
  export function detailsTranslationTemplate(request) {
    return `
    <div class="detail-item">
      <label>Request ID ${request.id}</label>
    </div>
    <div class="detail-item">
      <label>Languages</label>
      <div class="detail-value">${request.originalLanguage} to ${request.targetLanguage}</div>
    </div>
    <div class="detail-item">
      <label>Document Link</label>
    <div>
      <a href="${request.docLink}" target="_blank">Document original</a>
    </div>
    </div>
    <div class="detail-item">
      <label>Page Count</label>
      <div class="detail-value">${request.docPageCount}</div>
    </div>
    <div class="detail-item">
      <label>Details</label>
      <div class="detail-value">${request.description}</div>
    </div>`;
  }
  
  export function processingInterpretationTemplate(request, formattedData) {
    return `
    <div class="detail-item">
      <label>Status</label>
    <div><span class="badge ${formattedData.badgeClass}">${request.status}</span></div>
    </div>
    <div class="detail-item">
      <label>Interpreter selected</label>
      ${contractorSelectTemplate()}
      <div class="interpreter-name" style="display:none;margin-top:8px;">
        <label>Name</label>
         <div class="detail-value"></div>
      </div>
    </div>
    <div class="detail-item">
      <label>Interpreter contracted</label>
      <div class="detail-value"></div>
    </div>
    <div class="detail-item">
      <label>Guest attendance confirmed</label>
      <div class="detail-value"></div>
    </div>
    <div class="detail-item">
      <label>Technology confirmed</label>
      <div class="detail-value"></div>
    </div>
    `;
  }
  
  export function processingTranslationTemplate(request, formattedData) {
    return`
    <div class="detail-item">
      <label>Status</label>
    <div><span class="badge ${formattedData.badgeClass}">${request.status}</span></div>
    </div>
    <div class="detail-item">
      <label>Translation service</label>
      ${contractorSelectTemplate()}
      <div class="interpreter-name" style="display:none;margin-top:8px;">
        <label>Name</label>
        <div class="detail-value"></div>
      </div>
    </div>
    <div class="detail-item">
      <label>Document sent (date)</label>
      <div class="detail-value"></div>
    </div>
    <div class="detail-item">
      <label>Document received (date)</label>
      <div class="detail-value"></div>
    </div>
    `;
  }

  function contractorSelectTemplate() {
    return `<select id="translation-select">
        <option value="">Select a translation service</option>
        <option value="Lexikeet">Lexikeet</option>
        <option value="MAPA">MAPA</option>
        <option value="Google Translate">Google Translate</option>
        <option value="Staff member">Staff member</option>
        <option value="Contractor">Contractor</option>
      </select>`;
  }