export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  summary: string;
  sections: ReleaseNoteSection[];
}

export interface ReleaseNoteSection {
  title: string;
  description: string;
  items: string[];
}

/*
 * To publish a new in-app changelog notification:
 * 1. Add a new release note at the top of RELEASE_NOTES.
 * 2. Increase the version, for example from 0.1.0 to 0.1.1.
 * 3. Update CHANGELOG.md with the same high-level changes.
 *
 * The notification is not generated automatically from Git commits.
 * It appears automatically to users only when this latest version changes.
 */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '0.3.0',
    date: '2026-07-21',
    title: 'Ready-to-Print Faculty Reports',
    summary:
      'This release adds the Faculty Reports dashboard for Admin and HR users, improves Ready-to-Print performance, and makes faculty evaluation printing more reliable in production.',
    sections: [
      {
        title: 'Faculty Reports',
        description: 'Admin and HR users now have a focused dashboard for print-ready evaluations.',
        items: [
          'Added a Faculty Reports dashboard showing faculty with both Student Evaluation and Supervisor Evaluation score records.',
          'HR users now see only Faculty Dashboard, Supervisor Evaluations, and Faculty Reports in the sidebar.',
          'Faculty Reports access is available to both Admin and HR roles.',
        ],
      },
      {
        title: 'Print Workflow',
        description: 'Single and bulk faculty evaluation printing is more stable for large production data.',
        items: [
          'Bulk printing now prepares filtered reports in smaller batches instead of one oversized response.',
          'Print-ready faculty IDs are fetched through a lightweight endpoint before report generation.',
          'The printed Name of Staff now uses the logged-in user account firstname and lastname.',
          'Removed the digital signature and QR verification block from the print template.',
        ],
      },
      {
        title: 'Performance',
        description: 'Ready-to-Print data now avoids repeated heavy aggregation work.',
        items: [
          'Ready-to-Print faculty queries now read from a summary table optimized for the active term.',
          'Readiness dashboard and faculty-ID results are cached and evicted when new evaluations are submitted.',
          'Added a collation alignment migration to prevent MySQL comparison errors in production.',
          'Client-aborted print responses are handled quietly instead of being logged as application failures.',
        ],
      },
    ],
  },
  {
    version: '0.2.2',
    date: '2026-07-14',
    title: 'Optimization and Session Alignment',
    summary:
      'This patch aligns the browser and backend session timeout policy, improves Faculty Dashboard bulk-print feedback, and adds backend guards for safer paginated admin requests.',
    sections: [
      {
        title: 'Session Reliability',
        description: 'The frontend now follows the same inactivity window as the backend.',
        items: [
          'The browser-side session timer now uses the ten-minute inactivity policy.',
          'Active users get the intended working window before an AFK session is closed.',
        ],
      },
      {
        title: 'Faculty Dashboard',
        description: 'Bulk-printing now communicates its required filter state more clearly.',
        items: [
          'The Bulk Print button stays disabled until a campus or college filter is selected.',
          'Clearing filters now also clears the college filter used for bulk printing.',
        ],
      },
      {
        title: 'Backend Efficiency',
        description: 'Administrative list requests now have safer defaults.',
        items: [
          'Faculty workload coverage is cached for the active term to reduce repeated aggregation work.',
          'Backend pagination and sorting are clamped for selected admin listings.',
        ],
      },
    ],
  },
  {
    version: '0.2.1',
    date: '2026-07-10',
    title: 'Session Timeout Refinement',
    summary:
      'Sessions now expire after ten minutes of inactivity, with clearer coordination between the browser and backend so active users stay signed in while AFK sessions are closed.',
    sections: [
      {
        title: 'Session Timeout',
        description: 'The inactivity window now matches the updated system policy.',
        items: [
          'Authenticated sessions now expire after ten minutes without user activity.',
          'Keyboard, pointer, touch, scroll, focus, and tab visibility are treated as user activity.',
          'The app checks the inactivity deadline before sending protected requests.',
        ],
      },
      {
        title: 'Backend Coordination',
        description: 'Session renewal now depends on real user activity.',
        items: [
          'Protected requests include an activity signal only when recent user interaction is detected.',
          'Background requests no longer keep an idle session alive by themselves.',
          'Active users can continue working normally without being signed out mid-task.',
        ],
      },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-07-09',
    title: 'Class Assignment and Session Update',
    summary:
      'Administrators can now correct faculty assignments for current-term classes, with stronger audit tracking and more reliable session handling.',
    sections: [
      {
        title: 'Class Assignments',
        description: 'A focused workflow for correcting late faculty changes.',
        items: [
          'A new Class Assignments page lists current-term classes with search, campus filters, and pagination.',
          'Administrators can review the current instructor and confirm a replacement from active faculty in the same source campus.',
          'Saved changes appear immediately without refreshing the dashboard.',
        ],
      },
      {
        title: 'Accountability',
        description: 'Additional safeguards for administrative corrections.',
        items: [
          'Faculty reassignments now record the administrator, affected class, previous faculty, and new faculty in the audit log.',
          'The system rejects stale changes when another administrator has already updated the same class.',
          'Only the class faculty assignment is corrected; student loads, evaluations, and migrated source records are preserved.',
        ],
      },
      {
        title: 'Session Reliability',
        description: 'Sign-in behavior now follows actual system activity.',
        items: [
          'Authenticated sessions expire after five minutes without user or system activity.',
          'Active users remain signed in while working, including across tab focus and normal API activity.',
          'Access-denied responses no longer incorrectly sign users out.',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-07-08',
    title: 'System Integration and Faculty Workload Update',
    summary:
      'This update improves how the frontend communicates with the backend and makes faculty workload records more reliable when they are reviewed or edited.',
    sections: [
      {
        title: 'Faculty Management',
        description: 'Updates that affect faculty records and workload handling.',
        items: [
          'Faculty lists can now be filtered by campus while the backend keeps the original legacy database values.',
          'Faculty workload editing now opens the latest record from the backend before displaying it in the form.',
          'Faculty records marked for migration are kept out of the regular faculty dashboard population.',
        ],
      },
      {
        title: 'Administrative Visibility',
        description: 'Updates that support monitoring and system review.',
        items: [
          'Audit logs and faculty workload coverage are now part of the documented administrative workflow.',
          'Frontend and backend integration notes have been added for easier maintenance.',
        ],
      },
      {
        title: 'System Maintenance',
        description: 'Internal cleanup that helps keep the application stable.',
        items: [
          'Removed unused frontend calls to student endpoints that are no longer provided by the backend.',
          'Added changelog and version-control documentation for coordinated releases.',
        ],
      },
    ],
  },
];

export const LATEST_RELEASE_NOTE = RELEASE_NOTES[0];
