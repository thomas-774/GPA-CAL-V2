/**
 * ============================================================
 *  APPLICATION ENTRY POINT
 *  Instantiates all classes and starts the app.
 * ============================================================
 */

// Global namespace for cross-screen access
const UI = {};

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Instantiate Models ──────────────────────────────────
  const gradeScale         = new GradeScale();
  const courseRecords      = new CourseRecords();
  const session            = new CalculationSession();
  const calcType           = new CalculationType();

  // ── 2. Instantiate Controllers ─────────────────────────────
  const gradeController        = new GradeController(gradeScale);
  const gpaController          = new GPAController(gradeScale);
  const courseController       = new CourseController();
  const calculationController  = new CalculationController(session, calcType);

  // ── 3. Instantiate UI Screens ──────────────────────────────
  const screenManager         = new ScreenManager();
  const mainMenuScreen        = new MainMenuScreen(screenManager, calculationController);
  const gradeConversionScreen = new GradeConversionScreen(screenManager, gradeController);
  const courseInputScreen     = new CourseInputScreen(screenManager, courseController);
  const courseListScreen      = new CourseListScreen(screenManager);
  const gpaCalculationScreen  = new GPACalculationScreen(screenManager, gpaController);
  const resultScreen          = new ResultScreen(screenManager);

  // ── 4. Publish to global UI namespace ─────────────────────
  Object.assign(UI, {
    gradeScale,
    courseRecords,
    session,
    calcType,
    gradeController,
    gpaController,
    courseController,
    calculationController,
    screenManager,
    mainMenuScreen,
    gradeConversionScreen,
    courseInputScreen,
    courseListScreen,
    gpaCalculationScreen,
    resultScreen,
  });

  // ── 5. Initialize screens ──────────────────────────────────
  mainMenuScreen.init();

  // ── 6. Show initial screen ─────────────────────────────────
  mainMenuScreen.displayMenu();
});
