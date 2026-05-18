# ReviewSummary - max call depth exceeded

## Context

ReviewSummary component is a part of the Contribute form. It does NOT contain the submit button.

## The bug

When trying to submit the form, the following error is thrown:

```plain
Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.

The above error occurred in the <ReviewSummary> component. It was handled by the <ErrorBoundary> error boundary.
```

Expected behavior: the form should be submitted successfully.
