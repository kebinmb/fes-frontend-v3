type ErrorLike = {
  status?: number;
  error?: unknown;
  message?: string;
};

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === 'object' && value !== null;
}

function readMessage(value: unknown): string | null {
  if (!isErrorLike(value)) {
    return null;
  }

  return typeof value.message === 'string' && value.message
    ? value.message
    : null;
}

export function extractErrorMessage(err: unknown): string {
  if (!err) {
    return 'Something went wrong';
  }

  if (!isErrorLike(err)) {
    return 'Something went wrong';
  }

  if (err.status === 0) {
    return 'Cannot connect to server';
  }

  const nestedMessage = readMessage(err.error);

  if (nestedMessage) {
    return nestedMessage;
  }

  if (typeof err.error === 'string') {

    try {

      const parsed =
        JSON.parse(err.error);

      return readMessage(parsed) || err.error;

    } catch {

      return err.error;
    }
  }

  switch (err.status) {

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
        readMessage(err) ||
        'Something went wrong'
      );
  }
}
