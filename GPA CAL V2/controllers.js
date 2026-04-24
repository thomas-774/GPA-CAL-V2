/**
 * ============================================================
 *  CONTROLLERS LAYER
 *  Business logic — pure functions / methods, no DOM access.
 * ============================================================
 */

// ── GradeController ───────────────────────────────────────────
/**
 * Validates marks and converts numeric marks to letter grades.
 * Depends on a GradeScale instance.
 */
class GradeController {
  constructor(gradeScale) {
    this.gradingScale = gradeScale; // GradeScale
  }

  /**
   * Validates a raw mark input.
   * @param {any} value - raw string or number from the UI
   * @returns {{ valid: boolean, value?: number, error?: string }}
   */
  validateMark(value) {
    const num = parseFloat(value);
    if (value === '' || value === null || value === undefined) {
      return { valid: false, error: 'Mark cannot be empty.' };
    }
    if (isNaN(num)) {
      return { valid: false, error: 'Mark must be a numeric value.' };
    }
    if (num < 0 || num > 100) {
      return { valid: false, error: 'Mark must be between 0 and 100.' };
    }
    return { valid: true, value: num };
  }

  /**
   * Converts a validated numeric mark to its letter grade.
   * @param {number} mark
   * @returns {{ success: boolean, grade?: string, error?: string }}
   */
  convertMarkToGrade(mark) {
    const letter = this.gradingScale.getLetterGrade(mark);
    if (!letter) {
      return { success: false, error: 'Could not convert mark to grade.' };
    }
    return { success: true, grade: letter };
  }
}

// ── GPAController ─────────────────────────────────────────────
/**
 * Validates course inputs and calculates GPA on the 4.0 scale.
 */
class GPAController {
  constructor(gradeScale) {
    this.gradeScale   = gradeScale;
    this.courseRecords = null; // set per calculation
    this.gpaValue      = null;
  }

  /**
   * Validates an array of raw course data objects.
   * Each object: { courseName, creditHours, mark?, grade? }
   * @param {Array} rawCourses
   * @param {'marks'|'grades'} mode
   * @returns {{ valid: boolean, courses?: Course[], errors?: string[] }}
   */
  validateInputs(rawCourses, mode) {
    const errors  = [];
    const courses = [];

    if (!rawCourses || rawCourses.length === 0) {
      return { valid: false, errors: ['Please add at least one course.'] };
    }

    rawCourses.forEach((raw, i) => {
      const label = `Course ${i + 1}`;

      // Course name
      if (!raw.courseName || raw.courseName.trim() === '') {
        errors.push(`${label}: Course name cannot be empty.`);
      }

      // Credit hours
      const ch = parseFloat(raw.creditHours);
      if (isNaN(ch) || ch <= 0) {
        errors.push(`${label}: Credit hours must be a number greater than 0.`);
      }

      if (mode === 'marks') {
        const gc = new GradeController(this.gradeScale);
        const result = gc.validateMark(raw.mark);
        if (!result.valid) {
          errors.push(`${label}: ${result.error}`);
        } else {
          const conv = gc.convertMarkToGrade(result.value);
          if (!conv.success) {
            errors.push(`${label}: ${conv.error}`);
          } else {
            courses.push(new Course(
              raw.courseName.trim(),
              ch,
              result.value,
              conv.grade
            ));
          }
        }
      } else { // grades mode
        const letter = (raw.grade || '').toUpperCase().trim();
        if (!this.gradeScale.isValidLetterGrade(letter)) {
          errors.push(`${label}: "${raw.grade}" is not a valid letter grade (e.g. A, B+, C-).`);
        } else {
          courses.push(new Course(
            raw.courseName.trim(),
            ch,
            null,
            letter
          ));
        }
      }
    });

    if (errors.length > 0) {
      return { valid: false, errors };
    }
    return { valid: true, courses };
  }

  /**
   * Calculates GPA from an array of Course instances.
   * Formula: Σ(gradePoints × creditHours) / Σ(creditHours)
   * @param {Course[]} courses
   * @returns {number} GPA rounded to 2 decimal places
   */
  calculateGPA(courses) {
    let totalPoints = 0;
    let totalHours  = 0;

    courses.forEach(course => {
      const points = this.gradeScale.getGradePoint(course.grade);
      totalPoints += points * course.creditHours;
      totalHours  += course.creditHours;
    });

    if (totalHours === 0) return 0;
    this.gpaValue = Math.round((totalPoints / totalHours) * 100) / 100;
    return this.gpaValue;
  }

  /**
   * Converts course marks to grade points (helper used by marks mode).
   * Returns array of { letter, points } for each course.
   */
  convertMarksToPoints(courses) {
    return courses.map(course => ({
      letter: course.grade,
      points: this.gradeScale.getGradePoint(course.grade),
    }));
  }
}

// ── CourseController ──────────────────────────────────────────
/**
 * Handles course creation, deletion, and list management.
 */
class CourseController {
  constructor() {
    this.totalCourses = 0;
  }

  /**
   * Validates the number of courses entered.
   * @param {any} value
   * @returns {{ valid: boolean, value?: number, error?: string }}
   */
  validateCourseCount(value) {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1) {
      return { valid: false, error: 'Please enter a valid number of courses (minimum 1).' };
    }
    if (n > 20) {
      return { valid: false, error: 'Maximum 20 courses allowed per calculation.' };
    }
    return { valid: true, value: n };
  }

  /**
   * Returns an array of field-descriptor objects for n courses.
   * The UI layer uses this to render input fields.
   */
  createCourseFields(n) {
    this.totalCourses = n;
    return Array.from({ length: n }, (_, i) => ({ index: i }));
  }

  /**
   * Removes a course from a CourseRecords instance by index.
   */
  deleteCourse(courseRecords, index) {
    courseRecords.removeAt(index);
  }

  /**
   * Updates internal count after a deletion.
   */
  updateCourseList(courseRecords) {
    this.totalCourses = courseRecords.records.count;
  }
}

// ── CalculationController ─────────────────────────────────────
/**
 * Manages the top-level calculation type and application flow.
 */
class CalculationController {
  constructor(session, calcType) {
    this.selectedCalculationType = null;
    this.session  = session;   // CalculationSession
    this.calcType = calcType;  // CalculationType
  }

  /**
   * Stores user's selected mode and updates session state.
   * @param {'marks'|'grades'|'conversion'} type
   */
  processCalculationType(type) {
    this.selectedCalculationType = type;
    this.calcType.storeSelectedType(type);
    this.session.setState(type);
  }

  /** Resets the whole calculation back to idle */
  resetCalculation() {
    this.selectedCalculationType = null;
    this.session.clearSession();
    this.calcType.storeSelectedType(null);
  }

  /** Restarts for a new calculation (same as reset) */
  controlFlow() {
    this.resetCalculation();
  }
}
