export interface DashboardStats {
  openTickets: {
    total: number;
    highPriority: number;
  };
  responseTime: {
    average: number;
    trend: number;
  };
  satisfaction: {
    score: number;
    responses: number;
  };
  teamSize: {
    total: number;
    online: number;
  };
} 