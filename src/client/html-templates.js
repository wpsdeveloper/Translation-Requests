export function emptyRowTemplate() {
  return `<div class="empty-state">Select a request row to view details here.</div>`;
}

export function emptyDetailsTemplate() {
  return `<div class="empty-state">No request selected.</div>`;
}

export function tableRowTemplate(request, formattedData) { 
  return `<tr data-id="${request.id}" class="${formattedData.isActive ? 'active' : 'inactive'}">
    <td><span class="badge ${formattedData.badgeClass}">${request.status}</span></td>
    <td>${formattedData.requestDate}</td>
    <td>${formattedData.submittedDate}</td>
    <td>${request.reqType}</td>
    <td>${request.name}</td>
  </tr>`
}

export function detailsInterpretationTemplate(request, formattedData) {
  return `
  <div id="details-column-1">
    <div class="detail-item">
      <label>Request ID ${request.id}</label>
    </div>
    <div class="detail-item">
      <label>Status</label>
      <div><span class="badge ${formattedData.badgeClass}">${request.status}</span></div>
    </div>
    <div class="detail-item">
      <label>Languages</label>
      <div>${request.originalLanguage} to ${request.targetLanguage}</div>
    </div>
    <div class="detail-item">
      <label>Event Details</label>
      <div>
        ${formattedData.requestDate}<br> 
        ${formattedData.startTime}-${formattedData.endTime}<br>
        ${request.eventLocation}
      </div>
    </div>
    <div class="detail-item">
      <label>Details</label>
      <div>${request.description}</div>
    </div>
  </div>
  <div id="column-2">
    <div class="detail-item">
      <label>Interpreter selected</label>
      ${contractorSelectTemplate()}
    </div>
    <div class="detail-item">
      <div class="interpreter-name">
        <label>InterpreterName</label>
        <input type="text" class="form-control" id="interpreter-name" /> 
      </div>
    </div>
    <div class="detail-item">
      <label>Interpreter contracted</label>
      <input type="date" class="form-control" id="interpreter-contracted-date" /> 
    </div>
    <div class="detail-item">
      <label>Guest attendance confirmed</label>
      <input type="date" class="form-control" id="guest-attendance-date" /> 
    </div>
    <div class="detail-item">
      <label>Technology confirmed</label>
      <input type="date" class="form-control" id="technology-confirmed-date" /> 
    </div>
  </div>
  `;
  }
  
  export function detailsTranslationTemplate(request, formattedData) {
    return `
      <div id="details-column-1">
        <div class="detail-item">
          <label>Request ID ${request.id}</label>
        </div>
        <div class="detail-item">
          <label>Status</label>
          <div><span class="badge ${formattedData.badgeClass}">${request.status}</span></div>
        </div>
        <div class="detail-item">
          <label>Languages</label>
          <div>${request.originalLanguage} to ${request.targetLanguage}</div>
        </div>
        <div class="detail-item">
          <label>Document Link</label>
          <div><a href="${request.docLink}" target="_blank">Document original</a></div>
        </div>
        <div class="detail-item">
          <label>Length</label>
          <div>${request.docPageCount} pages</div>
        </div>
        <div class="detail-item">
          <label>Details</label>
          <div>${request.description}</div>
        </div>
      </div>
      <div id="details-column-2">
        <div class="detail-item">
          <label>Translation service</label>
          ${contractorSelectTemplate()}
          <div class="interpreter-name" style="display:none;margin-top:8px;">
            <label>Name</label>
            <div class="detail-value"></div>
          </div>
        </div>
        <div class="detail-item">
          <div class="interpreter-name">
            <label>Interpreter Name</label>
            <input type="text" class="form-control" id="interpreter-name" /> 
          </div>
        </div>
        <div class="detail-item">
          <label>Document sent</label>
          <input type="date" class="form-control" id="document-sent-date" /> 
        </div>
        <div class="detail-item">
          <label>Document received</label>
          <input type="date" class="form-control" id="document-received-date" /> 
        </div>
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