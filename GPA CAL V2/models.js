/**
 * ============================================================
 *  MODELS LAYER
 *  All data classes — no UI, no calculation logic here.
 * ============================================================
 */

// ── GradeScale ────────────────────────────────────────────────
/**
 * Holds the predefined grading scale.
 * Maps numeric marks ➜ letter grades ➜ grade points (4.0 scale).
 */
class GradeScale {
  constructor() {
    // Each entry: { min, max, letter, points }
    this.gradeRanges = [
      { min: 96, max: 100, letter: 'A+', points: 4.0 },
      { min: 92, max: 95.9,  letter: 'A',  points: 3.7 },
      { min: 88, max: 91.9,  letter: 'A-', points: 3.4 },
      { min: 84, max: 87.9,  letter: 'B+', points: 3.2 },
      { min: 80, max: 83.9,  letter: 'B',  points: 3.0 },
      { min: 76, max: 79.9,  letter: 'B-', points: 2.8 },
      { min: 72, max: 75.9,  letter: 'C+', points: 2.6 },
      { min: 68, max: 71.9,  letter: 'C',  points: 2.4 },
      { min: 64, max: 67.9,  letter: 'C-', points: 2.2 },
      { min: 60, max: 63.9,  letter: 'D+', points: 2.0 },
      { min: 55, max: 59.9,  letter: 'D',  points: 1.5 },
      { min: 50, max: 54.9,  letter: 'D-',  points: 1.0 },
      { min: 0,  max: 49.9,  letter: 'F',  points: 0.0 },
    ];

    // Valid letter grades the user can directly enter
    this.validLetterGrades = new Set(
      this.gradeRanges.map(r => r.letter)
    );
  }

  /** Returns letter grade string for a numeric mark, or null if out of range */
  getLetterGrade(mark) {
    const range = this.gradeRanges.find(r => mark >= r.min && mark <= r.max);
    return range ? range.letter : null;
  }

  /** Returns grade point for a letter grade string, or null if invalid */
  getGradePoint(letter) {
    const range = this.gradeRanges.find(r => r.letter === letter.toUpperCase().trim());
    return range ? range.points : null;
  }

  /** Returns true if the given string is a recognised letter grade */
  isValidLetterGrade(letter) {
    return this.validLetterGrades.has(letter.toUpperCase().trim());
  }
}

// ── Course ────────────────────────────────────────────────────
/**
 * Represents a single academic course.
 * Stores name, credit hours, numeric mark, and letter grade.
 */
class Course {
  constructor(courseName, creditHours, mark = null, grade = null) {
    this.courseName  = courseName;   // string
    this.creditHours = creditHours;  // number > 0
    this.mark        = mark;         // number | null
    this.grade       = grade;        // string | null
  }

  /** Returns a plain-object snapshot of this course */
  getCourseData() {
    return {
      courseName:  this.courseName,
      creditHours: this.creditHours,
      mark:        this.mark,
      grade:       this.grade,
    };
  }

  /** Updates the course fields from a plain object */
  setCourseData({ courseName, creditHours, mark, grade }) {
    this.courseName  = courseName  ?? this.courseName;
    this.creditHours = creditHours ?? this.creditHours;
    this.mark        = mark        ?? this.mark;
    this.grade       = grade       ?? this.grade;
  }
}

// ── CourseList ────────────────────────────────────────────────
/**
 * Manages an ordered collection of Course instances.
 */
class CourseList {
  constructor() {
    this.courses = []; // Course[]
  }

  /** Appends a Course object to the list */
  addCourse(course) {
    this.courses.push(course);
  }

  /** Removes the course at the given index */
  removeCourse(index) {
    if (index >= 0 && index < this.courses.length) {
      this.courses.splice(index, 1);
    }
  }

  /** Returns a copy of the courses array */
  getCourses() {
    return [...this.courses];
  }

  /** Clears all courses */
  clear() {
    this.courses = [];
  }

  /** Returns number of courses currently stored */
  get count() {
    return this.courses.length;
  }
}

// ── CourseRecords ─────────────────────────────────────────────
/**
 * Session-level store for processed course data.
 * Wraps a CourseList to save/retrieve courses during a session.
 */
class CourseRecords {
  constructor() {
    this.records = new CourseList();
  }

  saveCourse(course) {
    this.records.addCourse(course);
  }

  retrieveCourses() {
    return this.records.getCourses();
  }

  removeAt(index) {
    this.records.removeCourse(index);
  }

  clear() {
    this.records.clear();
  }
}

// ── CalculationSession ────────────────────────────────────────
/**
 * Tracks the runtime state of the current calculation.
 * currentState values: 'idle' | 'marks' | 'grades' | 'conversion'
 */
class CalculationSession {
  constructor() {
    this.currentState = 'idle';
  }

  clearSession() {
    this.currentState = 'idle';
  }

  restartSession() {
    this.clearSession();
  }

  setState(state) {
    this.currentState = state;
  }
}

// ── CalculationType ───────────────────────────────────────────
/** Stores which calculation type is selected */
class CalculationType {
  constructor() {
    this.typeName = null; // 'marks' | 'grades' | 'conversion'
  }

  storeSelectedType(type) {
    this.typeName = type;
  }
}
