// store/index.ts
import { authReducer } from './auth/auth.reducer';
import { toastReducer } from './toast/toast.reducer';
import { spinnerReducer } from './spinner/spinner.reducer';
import { studentLoadReducer } from './student-data/student-data.reducer';
import { supervisorDataReducer } from './supervisor-data/supervisor-data.reducer';
import { evaluationReducer } from './evaluation-data/evaluation.reducer';
import { adminDataReducer } from './admin-data/admin-data.reducer';

export const reducers = {
  auth: authReducer,
  toast: toastReducer,
  spinner: spinnerReducer,
  studentData: studentLoadReducer,
  supervisorData: supervisorDataReducer,
  evaluationData: evaluationReducer,
  adminData: adminDataReducer
};
