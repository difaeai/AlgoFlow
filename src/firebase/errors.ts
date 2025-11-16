
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const formattedContext = JSON.stringify(
      {
        path: context.path,
        operation: context.operation,
        requestResourceData: context.requestResourceData,
      },
      null,
      2
    );

    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${formattedContext}`;
    
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error stack trace cleaner
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
