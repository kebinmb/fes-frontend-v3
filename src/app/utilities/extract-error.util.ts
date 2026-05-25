export function extractErrorMessage(
  err: any
): string {

  console.log(
    'FULL HTTP ERROR',
    err,
  );

  if (!err) {
    return 'Something went wrong';
  }

  if (err?.status === 0) {
    return 'Cannot connect to server';
  }

  if (err?.error?.message) {
    return err.error.message;
  }

  if (typeof err?.error === 'string') {

    try {

      const parsed =
        JSON.parse(err.error);

      return parsed?.message || err.error;

    } catch {

      return err.error;
    }
  }

  switch (err?.status) {

    case 400:
      return 'Bad request';

    case 401:
      return 'Unauthorized access';

    case 403:
      return 'Access forbidden';

    case 404:
      return 'Resource not found';

    case 500:
      return 'Internal server error';

    default:
      return (
        err?.message ||
        'Something went wrong'
      );
  }
}