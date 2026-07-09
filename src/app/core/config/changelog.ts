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
