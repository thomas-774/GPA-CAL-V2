/**
 * ============================================================
 *  UI LAYER
 *  Screen classes — each screen renders itself and wires events.
 *  All DOM manipulation lives here; zero logic in HTML.
 * ============================================================
 */

// ── ScreenManager ─────────────────────────────────────────────
/**
 * Manages which screen is currently visible.
 * All screens are <section> elements with [data-screen] attribute.
 */
class ScreenManager {
  constructor() {
    this.screens = document.querySelectorAll('[data-screen]');
  }

  /** Shows only the screen with the given name, hides all others */
  show(name) {
    this.screens.forEach(el => {
      el.classList.toggle('active', el.dataset.screen === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ── MainMenuScreen ────────────────────────────────────────────
class MainMenuScreen {
  constructor(screenManager, calculationController) {
    this.screenManager          = screenManager;
    this.calculationController  = calculationController;
    this.selectedOption         = null;
  }

  /** Renders event listeners on the main menu buttons */
  init() {
    document.getElementById('btn-convert')
      .addEventListener('click', () => this.getSelectedOption('conversion'));
    document.getElementById('btn-gpa-marks')
      .addEventListener('click', () => this.getSelectedOption('marks'));
    document.getElementById('btn-gpa-grades')
      .addEventListener('click', () => this.getSelectedOption('grades'));
  }

  displayMenu() {
    this.screenManager.show('main-menu');
  }

  getSelectedOption(option) {
    this.selectedOption = option;
    this.calculationController.processCalculationType(option);
    this.showNextScreen(option);
  }

  showNextScreen(option) {
    if (option === 'conversion') {
      UI.gradeConversionScreen.display();
    } else {
      UI.courseInputScreen.display(option);
    }
  }
}

// ── GradeConversionScreen ─────────────────────────────────────
class GradeConversionScreen {
  constructor(screenManager, gradeController) {
    this.screenManager  = screenManager;
    this.gradeController = gradeController;
    this.courseName     = '';
    this.mark           = null;
    this.letterGrade    = '';
  }

  display() {
    this.screenManager.show('grade-conversion');
    this._render();
  }

  _render() {
    const container = document.getElementById('conversion-form');
    container.innerHTML = '';

    // Course name field
    const nameGroup = this._makeField('text', 'conv-name', 'Course Name (optional)', '');
    container.appendChild(nameGroup);

    // Mark field
    const markGroup = this._makeField('number', 'conv-mark', 'Numeric Mark (0 – 100)', '0');
    container.appendChild(markGroup);

    // Error area
    const errEl = document.createElement('p');
    errEl.id = 'conv-error';
    errEl.className = 'error-msg hidden';
    container.appendChild(errEl);

    // Convert button
    const btn = document.createElement('button');
    btn.textContent = 'Convert';
    btn.className = 'btn btn-primary';
    btn.addEventListener('click', () => this._onConvert());
    container.appendChild(btn);

    // Back button
    const back = document.createElement('button');
    back.textContent = '← Back to Menu';
    back.className = 'btn btn-ghost';
    back.addEventListener('click', () => UI.mainMenuScreen.displayMenu());
    container.appendChild(back);
  }

  _makeField(type, id, label, placeholder) {
    const group = document.createElement('div');
    group.className = 'field-group';
    group.innerHTML = `
      <label for="${id}">${label}</label>
      <input type="${type}" id="${id}" placeholder="${placeholder}" min="0" max="100" step="0.01">
    `;
    return group;
  }

  inputMark() {
    return document.getElementById('conv-mark').value;
  }

  _onConvert() {
    const markVal = this.inputMark();
    const result  = this.gradeController.validateMark(markVal);

    if (!result.valid) {
      this._showError(result.error);
      return;
    }

    const conv = this.gradeController.convertMarkToGrade(result.value);
    if (!conv.success) {
      this._showError(conv.error);
      return;
    }

    this.letterGrade = conv.grade;
    this._showResult(result.value, conv.grade);
  }

  _showError(msg) {
    const el = document.getElementById('conv-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  _showResult(mark, grade) {
    document.getElementById('conv-error').classList.add('hidden');
    UI.resultScreen.displayConversionResult(mark, grade);
  }

  displayGrade(grade) {
    this.letterGrade = grade;
  }
}

// ── CourseInputScreen ─────────────────────────────────────────
class CourseInputScreen {
  constructor(screenManager, courseController) {
    this.screenManager   = screenManager;
    this.courseController = courseController;
    this.numberOfCourses  = 0;
    this.courseFields     = [];
    this._mode            = null;
  }

  display(mode) {
    this._mode = mode;
    this.screenManager.show('course-input');
    this._renderCountForm();
  }

  /** Step 1 – ask for number of courses */
  promptCourseCount() {
    this._renderCountForm();
  }

  _renderCountForm() {
    const container = document.getElementById('course-input-container');
    container.innerHTML = `
      <div class="field-group">
        <label for="course-count">How many courses?</label>
        <input type="number" id="course-count" min="1" max="20" placeholder="e.g. 5">
      </div>
      <p id="count-error" class="error-msg hidden"></p>
      <button class="btn btn-primary" id="btn-generate">Generate Fields</button>
      <button class="btn btn-ghost" id="btn-back-count">← Back to Menu</button>
    `;
    document.getElementById('btn-generate')
      .addEventListener('click', () => this._onGenerate());
    document.getElementById('btn-back-count')
      .addEventListener('click', () => UI.mainMenuScreen.displayMenu());
  }

  _onGenerate() {
    const val    = document.getElementById('course-count').value;
    const result = this.courseController.validateCourseCount(val);
    if (!result.valid) {
      document.getElementById('count-error').textContent = result.error;
      document.getElementById('count-error').classList.remove('hidden');
      return;
    }
    this.numberOfCourses = result.value;
    this.courseFields    = this.courseController.createCourseFields(result.value);
    this.displayCourseFields();
  }

  /** Step 2 – render dynamic course input fields */
  generateCourseFields(n) {
    this.courseFields = this.courseController.createCourseFields(n);
    this.displayCourseFields();
  }

  displayCourseFields() {
    const container = document.getElementById('course-input-container');
    const modeLabel = this._mode === 'marks' ? 'Numeric Mark' : 'Letter Grade';

    let html = `<div class="courses-grid" id="courses-grid">`;

    this.courseFields.forEach(field => {
      const i = field.index;
      html += `
        <div class="course-card" id="course-card-${i}">
          <div class="course-card-header">
            <span class="course-number">Course ${i + 1}</span>
            <button class="btn-delete" data-index="${i}" title="Remove course">✕</button>
          </div>
          <div class="field-group">
            <label for="name-${i}">Course Name</label>
            <input type="text" id="name-${i}" placeholder="e.g. Mathematics">
          </div>
          <div class="field-group">
            <label for="ch-${i}">Credit Hours</label>
            <input type="number" id="ch-${i}" min="1" max="6" placeholder="e.g. 3">
          </div>
          <div class="field-group">
            <label for="val-${i}">${modeLabel}</label>
            <input type="${this._mode === 'marks' ? 'number' : 'text'}" 
                   id="val-${i}" 
                   placeholder="${this._mode === 'marks' ? '0 – 100' : 'e.g. A, B+'}">
          </div>
        </div>
      `;
    });

    html += `</div>`;
    html += `<p id="calc-error" class="error-msg hidden"></p>`;
    html += `
      <div class="action-row">
        <button class="btn btn-primary" id="btn-calculate">Calculate GPA</button>
        <button class="btn btn-ghost" id="btn-back-fields">← Back to Menu</button>
      </div>
    `;

    container.innerHTML = html;

    // Delete buttons
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        this._onDeleteCourse(idx);
      });
    });

    document.getElementById('btn-calculate')
      .addEventListener('click', () => this._onCalculate());
    document.getElementById('btn-back-fields')
      .addEventListener('click', () => UI.mainMenuScreen.displayMenu());
  }

  /** Removes a course card by its original index, re-renders remaining */
  _onDeleteCourse(originalIndex) {
    // Remove from courseFields array
    const pos = this.courseFields.findIndex(f => f.index === originalIndex);
    if (pos !== -1) this.courseFields.splice(pos, 1);
    // Re-index
    this.courseFields = this.courseFields.map((f, i) => ({ ...f, index: i }));
    this.displayCourseFields();
    // Restore previously entered values is not needed per SRS (fields refresh)
  }

  /** Reads current field values and triggers GPA calculation */
  _onCalculate() {
    const rawCourses = this.courseFields.map(field => {
      const i = field.index;
      return {
        courseName:  (document.getElementById(`name-${i}`)?.value || '').trim(),
        creditHours: document.getElementById(`ch-${i}`)?.value || '',
        mark:        this._mode === 'marks'  ? document.getElementById(`val-${i}`)?.value : null,
        grade:       this._mode === 'grades' ? document.getElementById(`val-${i}`)?.value : null,
      };
    });

    UI.gpaCalculationScreen.process(rawCourses, this._mode);
  }
}

// ── CourseListScreen ──────────────────────────────────────────
class CourseListScreen {
  constructor(screenManager) {
    this.screenManager = screenManager;
    this.courseList    = [];
  }

  display(courses) {
    this.courseList = courses;
    this.screenManager.show('course-list');
    this._render();
  }

  _render() {
    const container = document.getElementById('course-list-container');
    if (this.courseList.length === 0) {
      container.innerHTML = `<p class="empty-msg">No courses to display.</p>`;
      return;
    }

    let html = `<div class="list-table-wrap"><table class="list-table">
      <thead><tr>
        <th>#</th><th>Course</th><th>Credit Hours</th><th>Grade</th><th>Points</th><th></th>
      </tr></thead><tbody>`;

    this.courseList.forEach((c, i) => {
      const pts = UI.gradeScale.getGradePoint(c.grade);
      html += `<tr>
        <td>${i + 1}</td>
        <td>${c.courseName}</td>
        <td>${c.creditHours}</td>
        <td><span class="grade-badge grade-${c.grade.replace('+','plus').replace('-','minus')}">${c.grade}</span></td>
        <td>${pts.toFixed(1)}</td>
        <td><button class="btn-delete-list" data-idx="${i}">Delete</button></td>
      </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;

    container.querySelectorAll('.btn-delete-list').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.selectCourseToDelete(idx);
      });
    });
  }

  displayCourses() { this._render(); }

  selectCourseToDelete(index) {
    this.courseList.splice(index, 1);
    this.refreshCourseList();
    // Re-calculate GPA with updated list
    if (this.courseList.length > 0) {
      const gpa = UI.gpaController.calculateGPA(this.courseList);
      UI.resultScreen.displayGPAResult(this.courseList, gpa, UI.calcType.typeName);
    }
    this._render();
  }

  refreshCourseList() {
    this._render();
  }
}

// ── GPACalculationScreen ──────────────────────────────────────
class GPACalculationScreen {
  constructor(screenManager, gpaController) {
    this.screenManager  = screenManager;
    this.gpaController  = gpaController;
    this.selectedInputMethod = null;
    this.enteredCourses = [];
    this.calculatedGPA  = null;
  }

  chooseInputMethod(method) {
    this.selectedInputMethod = method;
  }

  /**
   * Validates inputs and triggers result display.
   * Called by CourseInputScreen after the user clicks "Calculate GPA".
   */
  process(rawCourses, mode) {
    this.chooseInputMethod(mode);
    const validation = this.gpaController.validateInputs(rawCourses, mode);

    if (!validation.valid) {
      this._showErrors(validation.errors);
      return;
    }

    this.enteredCourses = validation.courses;
    this.calculatedGPA  = this.gpaController.calculateGPA(this.enteredCourses);
    UI.resultScreen.displayGPAResult(this.enteredCourses, this.calculatedGPA, mode);
  }

  _showErrors(errors) {
    const errEl = document.getElementById('calc-error');
    if (errEl) {
      errEl.innerHTML = errors.map(e => `• ${e}`).join('<br>');
      errEl.classList.remove('hidden');
      errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  collectCourseData() { return this.enteredCourses; }
  displayGPA(gpa)     { this.calculatedGPA = gpa; }
  displayError(msg)   { this._showErrors([msg]); }
}

// ── ResultScreen ──────────────────────────────────────────────
class ResultScreen {
  constructor(screenManager) {
    this.screenManager = screenManager;
    this.result        = null;
  }

  /** Displays the GPA result screen */
  displayGPAResult(courses, gpa, mode) {
    this.result = gpa;
    this.screenManager.show('result');
    const container = document.getElementById('result-container');

    const modeLabel = mode === 'marks' ? 'GPA by Marks' : 'GPA by Letter Grades';
    const gpaClass  = gpa >= 3.5 ? 'gpa-excellent'
                    : gpa >= 3.0 ? 'gpa-good'
                    : gpa >= 2.0 ? 'gpa-average'
                    : 'gpa-low';

    let tableRows = courses.map((c, i) => {
      const pts = UI.gradeScale.getGradePoint(c.grade);
      return `<tr>
        <td>${i + 1}</td>
        <td>${c.courseName}</td>
        <td>${c.creditHours}</td>
        ${mode === 'marks' ? `<td>${c.mark}</td>` : ''}
        <td><span class="grade-badge">${c.grade}</span></td>
        <td>${pts.toFixed(1)}</td>
        <td>${(pts * c.creditHours).toFixed(2)}</td>
      </tr>`;
    }).join('');

    const totalHours  = courses.reduce((s, c) => s + c.creditHours, 0);
    const totalPoints = courses.reduce((s, c) => s + UI.gradeScale.getGradePoint(c.grade) * c.creditHours, 0);

    container.innerHTML = `
      <div class="result-header">
        <p class="result-mode">${modeLabel}</p>
        <div class="gpa-display ${gpaClass}">
          <span class="gpa-label">Your GPA</span>
          <span class="gpa-value">${gpa.toFixed(2)}</span>
          <span class="gpa-scale">/ 4.00</span>
        </div>
        <p class="gpa-status">${this._gpaStatus(gpa)}</p>
      </div>

      <div class="list-table-wrap">
        <table class="list-table">
          <thead><tr>
            <th>#</th><th>Course</th><th>CH</th>
            ${mode === 'marks' ? '<th>Mark</th>' : ''}
            <th>Grade</th><th>Points</th><th>Weighted</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="${mode === 'marks' ? 4 : 3}"><strong>Total</strong></td>
              <td></td>
              <td><strong>${totalHours}</strong></td>
              <td><strong>${totalPoints.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="action-row">
        <button class="btn btn-primary" id="btn-new-calc">New Calculation</button>
        <button class="btn btn-secondary" id="btn-view-list">View Course List</button>
        <button class="btn btn-ghost" id="btn-back-result">← Back to Menu</button>
      </div>
    `;

    document.getElementById('btn-new-calc')
      .addEventListener('click', () => this.askForNewCalculation());
    document.getElementById('btn-view-list')
      .addEventListener('click', () => UI.courseListScreen.display(courses));
    document.getElementById('btn-back-result')
      .addEventListener('click', () => this.redirectToMainMenu());
  }

  /** Displays conversion result (mark → grade) */
  displayConversionResult(mark, grade) {
    this.result = grade;
    this.screenManager.show('result');
    const container = document.getElementById('result-container');

    const pts = UI.gradeScale.getGradePoint(grade);

    container.innerHTML = `
      <div class="result-header">
        <p class="result-mode">Grade Conversion</p>
        <div class="conversion-result">
          <div class="conv-row">
            <span class="conv-label">Numeric Mark</span>
            <span class="conv-value">${mark}</span>
          </div>
          <div class="conv-arrow">↓</div>
          <div class="conv-row highlight">
            <span class="conv-label">Letter Grade</span>
            <span class="grade-badge grade-big">${grade}</span>
          </div>
          <div class="conv-row">
            <span class="conv-label">Grade Points</span>
            <span class="conv-value">${pts.toFixed(1)} / 4.0</span>
          </div>
        </div>
      </div>
      <div class="action-row">
        <button class="btn btn-primary" id="btn-new-calc-conv">Convert Another</button>
        <button class="btn btn-ghost" id="btn-back-conv">← Back to Menu</button>
      </div>
    `;

    document.getElementById('btn-new-calc-conv')
      .addEventListener('click', () => UI.gradeConversionScreen.display());
    document.getElementById('btn-back-conv')
      .addEventListener('click', () => this.redirectToMainMenu());
  }

  showResult()             { /* already shown inline */ }

  askForNewCalculation() {
    UI.calculationController.resetCalculation();
    UI.mainMenuScreen.displayMenu();
  }

  redirectToMainMenu() {
    UI.calculationController.resetCalculation();
    UI.mainMenuScreen.displayMenu();
  }

  _gpaStatus(gpa) {
    if (gpa >= 3.7) return '🏆 Excellent standing';
    if (gpa >= 3.0) return '✅ Good standing';
    if (gpa >= 2.0) return '📘 Satisfactory';
    if (gpa >= 1.0) return '⚠️ Below average';
    return '❌ Failing';
  }
}
