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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const currentMemId = getActiveMembershipId();
  if (currentMemId) {
    headers.set('x-membership-id', currentMemId);
  }

  const res = await fetch(path, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error?.message || `HTTP ${res.status}: Failed to fetch`);
  }

  return json.data;
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
