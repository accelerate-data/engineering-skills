# GitHub Review Posting

Before any GitHub side effect, present the drafted review to the user.

Show:

- the proposed event type: `APPROVE`, `REQUEST_CHANGES`, or plain `COMMENT`
- the drafted review text
- any criteria that were checked off
- any remaining risks or next steps

Wait for explicit user approval before posting.

After approval, post a real GitHub PR review event. Do not post before the user approves the draft.
