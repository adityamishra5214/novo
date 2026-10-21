import { OverviewData, RepPortalData, PersonaOption, User, Membership, Company } from './types.js';

let activeMembershipId: string | null = null;

export function setActiveMembershipId(id: string | null) {
  activeMembershipId = id;
  if (id) {
    localStorage.setItem('vantage_membership_id', id);
  } else {
    localStorage.removeItem('vantage_membership_id');
  }
}

export function getActiveMembershipId(): string | null {
  if (!activeMembershipId) {
    activeMembershipId = localStorage.getItem('vantage_membership_id');
  }
  return activeMembershipId;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const currentMemId = getActiveMembershipId();
  if (currentMemId) {
    headers.set('x-membership-id', currentMemId);
  }

  const res = await fetch(path, { ...options, headers, credentials: 'include' });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(json.error?.message || `HTTP ${res.status}: Failed to fetch`, res.status, json.error?.code);
  }

  return json.data;
}

export async function login(credentials: { email: string; password: string; remember?: boolean }) {
  const data = await request<{ user: User; membershipId: string | null }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  if (data.membershipId) {
    setActiveMembershipId(data.membershipId);
  }
  return data;
}

export async function register(formData: {
  displayName: string;
  email: string;
  password: string;
  companyName: string;
}) {
  const data = await request<{ user: User; companyId: string; membershipId: string }>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  if (data.membershipId) {
    setActiveMembershipId(data.membershipId);
  }
  return data;
}

export async function logout() {
  try {
    await request('/api/v1/auth/logout', { method: 'POST' });
  } finally {
    setActiveMembershipId(null);
  }
}

export async function switchMembershipContext(membershipId: string) {
  setActiveMembershipId(membershipId);
  await request('/api/v1/auth/switch-membership', {
    method: 'POST',
    body: JSON.stringify({ membershipId }),
  }).catch(() => {});
}

export async function fetchMe(): Promise<{
  user: User;
  membership: Membership;
  company: Company;
  availableMemberships: PersonaOption[];
}> {
  return request('/api/v1/auth/me');
}

export async function fetchExecutiveOverview(workspaceId: string): Promise<OverviewData> {
  return request(`/api/v1/workspaces/${workspaceId}/analytics/overview`);
}

export async function fetchRepPortal(workspaceId: string, membershipId?: string): Promise<RepPortalData> {
  const query = membershipId ? `?membershipId=${membershipId}` : '';
  return request(`/api/v1/workspaces/${workspaceId}/analytics/rep-portal${query}`);
}

export async function createSalesEntry(
  workspaceId: string,
  entry: {
    clientName: string;
    dealCategory: 'New ARR' | 'Expansion' | 'Services' | 'Renewal';
    businessDate: string;
    actualValue: number;
    note?: string;
    status?: 'Confirmed' | 'Draft';
  }
) {
  return request(`/api/v1/workspaces/${workspaceId}/sales-entries`, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function confirmSalesEntry(workspaceId: string, entryId: string) {
  return request(`/api/v1/workspaces/${workspaceId}/sales-entries/${entryId}/confirm`, {
    method: 'POST',
  });
}

export async function fetchMembers(workspaceId: string) {
  return request<any[]>(`/api/v1/workspaces/${workspaceId}/members`);
}

export async function inviteMember(workspaceId: string, data: any) {
  return request(`/api/v1/workspaces/${workspaceId}/members/invite`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchTargets(workspaceId: string) {
  return request<any[]>(`/api/v1/workspaces/${workspaceId}/targets`);
}

export async function createTarget(workspaceId: string, data: any) {
  return request(`/api/v1/workspaces/${workspaceId}/targets`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchAuditEvents(workspaceId: string) {
  return request<any[]>(`/api/v1/workspaces/${workspaceId}/audit-events`);
}
