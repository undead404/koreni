import { Octokit } from 'octokit';

import environment from '../environment.js';
import { logger } from '../logger.js';
import {
  githubWorkflowDispatchExceptionSchema,
  githubWorkflowDispatchHttpStatusSchema,
  githubWorkflowDispatchRequestIdSchema,
  githubWorkflowDispatchResponseHeadersSchema,
  githubWorkflowDispatchResponseMessageSchema,
  githubWorkflowDispatchResponseSchema,
} from '../schemata.js';

import { reportError } from './bugsnag.js';

const octokit = new Octokit({ auth: environment.GITHUB_TOKEN });
const UNKNOWN_DISPATCH_REASON = 'Unknown GitHub workflow dispatch error';
const DISPATCH_FAILED_EVENT = 'dependency.github.workflow_dispatch_failed';

type DispatchFailureLogFields = {
  github_request_id?: string;
  github_status?: number;
  reason: string;
};

function sanitizedReason(message: string): string {
  let reason = message;
  const configuredToken = environment.GITHUB_TOKEN;

  if (configuredToken) {
    reason = reason.split(configuredToken).join('[REDACTED_TOKEN]');
  }
  reason = reason
    .replaceAll(/\bBearer\s+[^\s,;]+/gi, '[REDACTED_TOKEN]')
    .replaceAll(
      /\b(authorization|token|access_token|api_key|password|secret)(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      (_match, key: string, separator: string) =>
        `${key}${separator}[REDACTED]`,
    )
    .replaceAll(
      /\b(?:gh[pousr]_\w{20,}|github_pat_\w{20,})\b/g,
      '[REDACTED_TOKEN]',
    )
    .replaceAll(/\b[\w.%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]')
    // eslint-disable-next-line no-control-regex
    .replaceAll(/[\u{0}-\u{1F}\u{7F}-\u{9F}]/gu, ' ')
    .trim()
    .slice(0, 500);

  return reason || UNKNOWN_DISPATCH_REASON;
}

function parseMessage(value: unknown): string | undefined {
  const result = githubWorkflowDispatchResponseMessageSchema.safeParse({
    message: value,
  });
  return result.success ? result.data.message : undefined;
}

function getGithubRequestId(headers: unknown): string | undefined {
  const parsedHeaders =
    githubWorkflowDispatchResponseHeadersSchema.safeParse(headers);
  if (!parsedHeaders.success) return undefined;

  const header = Object.entries(parsedHeaders.data).find(
    ([name]) => name.toLowerCase() === 'x-github-request-id',
  )?.[1];
  const parsed = githubWorkflowDispatchRequestIdSchema.safeParse(header);
  return parsed.success ? parsed.data : undefined;
}

function getDispatchFailureLogFields(error: unknown): DispatchFailureLogFields {
  const exception = githubWorkflowDispatchExceptionSchema.safeParse(error);
  if (!exception.success) return { reason: UNKNOWN_DISPATCH_REASON };

  const response = githubWorkflowDispatchResponseSchema.safeParse(
    exception.data.response,
  );
  const responseStatus = response.success
    ? githubWorkflowDispatchHttpStatusSchema.safeParse(response.data.status)
    : undefined;
  const exceptionStatus = githubWorkflowDispatchHttpStatusSchema.safeParse(
    exception.data.status,
  );
  const githubStatus = responseStatus?.success
    ? responseStatus.data
    : exceptionStatus.success
      ? exceptionStatus.data
      : undefined;

  const responseMessage = response.success
    ? (() => {
        const result = githubWorkflowDispatchResponseMessageSchema.safeParse(
          response.data.data,
        );
        return result.success ? result.data.message : undefined;
      })()
    : undefined;
  const exceptionMessage = parseMessage(exception.data.message);
  const reason = sanitizedReason(
    responseMessage ?? exceptionMessage ?? UNKNOWN_DISPATCH_REASON,
  );
  const requestId = response.success
    ? getGithubRequestId(response.data.headers)
    : undefined;

  return {
    ...(githubStatus && { github_status: githubStatus }),
    ...(requestId && { github_request_id: requestId }),
    reason,
  };
}

export default async function dispatchGithubWorkflow(): Promise<void> {
  try {
    const [owner, repo] = environment.GITHUB_REPO.split('/', 2);
    if (!owner || !repo)
      throw new Error('Invalid GitHub repository configuration');
    await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      ref: 'main',
      workflow_id: 'main.yml',
    });
  } catch (error: unknown) {
    let fields: DispatchFailureLogFields;
    try {
      fields = getDispatchFailureLogFields(error);
    } catch {
      fields = { reason: UNKNOWN_DISPATCH_REASON };
    }

    try {
      logger.error(DISPATCH_FAILED_EVENT, fields);
    } catch {
      try {
        logger.error(DISPATCH_FAILED_EVENT, {
          reason: UNKNOWN_DISPATCH_REASON,
        });
      } catch {
        // Diagnostic logging must not change the dispatch failure response.
      }
    }

    const dispatchError = new Error('GitHub workflow dispatch failed');
    reportError(dispatchError);
    throw dispatchError;
  }
}
