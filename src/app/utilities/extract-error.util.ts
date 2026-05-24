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

  if (
    typeof err === 'string'
  ) {

    return err;
  }

  if (
    typeof err?.error === 'string'
  ) {

    try {

      const parsed =
        JSON.parse(err.error);

      return (
        parsed?.message ||
        err.error
      );

    } catch {

      return err.error;
    }
  }

  if (
    err?.error?.message
  ) {

    return err.error.message;
  }

  if (
    err?.message
  ) {

    return err.message;
  }

  return 'Something went wrong';
}