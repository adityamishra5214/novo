# Authorization and Security

## 1. Roles are not enough
Use role-based access control (RBAC) for broad capabilities and resource-level policy checks for tenant, team, and record scope.

## 2. Suggested permissions
| Capability | Platform operator | Company admin | Team manager | Representative |
|---|---|---|---|---|
| Manage platform workspaces | Yes | No | No | No |
| View own company overview | Only if operationally necessary and audited | Yes | Scoped | No |
| Manage company members | No by default | Yes | No | No |
| Manage team membership | No | Yes | Assigned teams only if granted | No |
| Create company/team/user targets | No | Yes | Scoped if granted | No |
| Create personal target | No | If policy allows | If policy allows | Only if explicitly granted |
| Enter own daily sales | No | If also a rep | If also a rep | Yes |
| Edit own entry | No | If permitted | If permitted | Within edit policy |
| Edit another rep's entry | No | Yes, audited | Scoped, audited | No |
| View company-wide reports | No by default | Yes | No | No |
| View own performance | No | Yes if applicable | Yes if applicable | Yes |

Treat this table as a draft permission matrix. Explicitly resolve whether users can hold multiple roles and whether company admins can also submit sales.

## 3. Mandatory authorization checks
For every request:
1. Authenticate the caller.
2. Verify active membership in the requested company.
3. Verify the permission for the action.
4. Verify the resource belongs to the same company.
5. Verify team/individual scope where applicable.
6. Validate state transitions and edit windows.
7. Audit sensitive mutations.

Do not rely on client route guards, hidden buttons, or IDs being difficult to guess.

## 4. Tenant isolation
- Derive company scope from the authenticated membership and validated workspace context.
- Never trust a body/query `company_id` as authorization.
- Test IDOR/BOLA cases by replacing IDs with records belonging to another company.
- Consider PostgreSQL row-level security as defense in depth if it fits the selected architecture.
- Ensure exports, search, background jobs, and analytics queries enforce tenant scope too.

## 5. Audit requirements
Audit at minimum:
- Target creation, edits, archive, and reassignment.
- Sales entry creation, edits, approval/rejection, and deletion/void.
- Role and membership changes.
- Company settings changes.
- Platform operator access to customer data.

Audit events should identify actor, company, action, entity, time, request ID, and safe before/after changes. Do not expose audit internals to unauthorized users.

## 6. Authentication and data protection
- Use a maintained authentication solution.
- Hash passwords using a modern, appropriate password-hashing algorithm if passwords are managed directly.
- Use MFA for privileged roles when feasible.
- Apply rate limits to login, reset, and invitation endpoints.
- Use secure cookies or a correctly implemented token strategy.
- Validate and normalize input server-side.
- Apply output encoding and safe query parameterization.
- Configure CORS narrowly.
- Set security headers.
- Keep secrets out of source control and logs.
- Define retention, export, deletion, and backup policies.

## 7. Required security tests
- User from company A cannot list, read, modify, or delete company B records.
- Representative cannot change their role or company ID through a crafted payload.
- Representative cannot edit another representative's sales record.
- Team manager cannot access an unassigned team.
- Revoked membership loses access immediately according to the session policy.
- An unauthorized user cannot infer sensitive company data through error messages.
- Concurrent duplicate submissions do not create duplicate rows.
