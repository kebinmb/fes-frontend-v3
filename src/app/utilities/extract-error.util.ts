export function extractErrorMessage(err: any): string {
    return (
        err?.error?.message || err?.error?.error || err?.error || err?.message || 'Something went wrong'
    );
}
