export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarInitials: string;
  status: string;
}

export interface Membership {
  id: string;
  companyId: string;
  userId: string;
  role: 'operator' | 'admin' | 'manager' | 'rep';
  title: string;
  territory: string | null;
  status: string;
  teamId?: string | null;
  teamCode?: string | null;
  teamName?: string | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: string;
}

export interface PersonaOption {
  membershipId: string;
  companyId: string;
  companyName: string;
  userId: string;
  displayName: string;
  email: string;
  avatarInitials: string;
  role: 'operator' | 'admin' | 'manager' | 'rep';
  title: string;
  territory: string | null;
  teamName?: string | null;
  teamCode?: string | null;
}

export interface OverviewData {
  period: string;
  kpi: {
    totalClosedRevenue: {
      value: number;
      target: number;
      attainmentPercent: number;
      curveDelta: string;
    };
    targetDeltaGap: {
      value: number;
      remainingDays: number;
      requiredRatePerDay: number;
    };
    burnRunPace: {
      value: number;
      requiredPace: number;
      pacingText: string;
      bufferPercent: string;
    };
    submissionHealth: {
      percent: number;
      submittedCount: number;
      totalCount: number;
      alertCount: number;
      pendingRep: string;
    };
  };
  immediateAttention: {
    name: string;
    team: string;
    message: string;
    cutoff: string;
  } | null;
  segments: {
    enterprise: { target: number; actual: number; percent: number };
    midMarket: { target: number; actual: number; percent: number };
  };
  runRateForecast: number;
  cadenceDays: Array<{
    date: string;
    value: number;
    target: number;
    isPeak?: boolean;
  }>;
  leaderboard: Array<{
    membershipId: string;
    name: string;
    initials: string;
    title: string;
    team: string;
    quotaTarget: number;
    actualClosed: number;
    attainmentPercent: number;
    delta: number;
    status: 'Ahead' | 'On Track' | 'Needs Nudge';
  }>;
  recentCloses: Array<{
    id: string;
    client_name: string;
    deal_category: string;
    actual_value: number;
    rep_name: string;
    team_code: string;
    created_at: string;
  }>;
}

export interface RepPortalData {
  rep: {
    membershipId: string;
    name: string;
    title: string;
    territory: string;
    period: string;
    remainingBusinessDays: number;
  };
  kpi: {
    todaySalesLogged: {
      value: number;
      target: number;
      percent: number;
      delta: number;
      note: string;
    };
    monthToDateClosed: {
      value: number;
      target: number;
      percent: number;
      needPerDay: number;
      remainingDays: number;
    };
    projectedMonthEnd: {
      value: number;
      nominalPercent: string;
      pacingBuffer: string;
    };
    winEntryRate: {
      value: string;
      label: string;
      consecutiveDays: number;
      badge: string;
    };
  };
  chart: {
    benchmarkQuota: number;
    dateRange: string;
    bars: Array<{
      day: string;
      date: string;
      amount: number;
      isToday: boolean;
    }>;
  };
  pacingSurplus: {
    nominalDelta: string;
    remainingDelta: number;
    rollingCadence: number;
    thresholdDay: number;
    daysAhead: number;
    tier: string;
  };
  compliance: {
    time: string;
    cutoff: string;
    items: Array<{
      id: string;
      title: string;
      detail: string;
      completed: boolean;
    }>;
  };
  pacingTrack: {
    goal: number;
    tiers: Array<{
      label: string;
      value: number;
      unlocked: boolean;
      remaining?: number;
    }>;
  };
  drafts: Array<{
    id: string;
    client_name: string;
    deal_category: string;
    actual_value: number;
    note: string;
  }>;
  recentEntries: Array<{
    id: string;
    client_name: string;
    deal_category: string;
    actual_value: number;
    business_date: string;
    status: string;
    note?: string;
  }>;
}
