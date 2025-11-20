import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export function Audit() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const res = await auditAPI.getLogs({});
      return res.data;
    },
  });

  const getActionBadge = (action) => {
    const variants = {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'destructive',
      LOGIN: 'default',
      APPROVE: 'success',
      MARK_ATTENDANCE: 'default',
      BULK_MARK_ATTENDANCE: 'default',
      CALCULATE_PAYROLL: 'default',
      PASSWORD_CHANGE: 'warning',
    };
    return <Badge variant={variants[action] || 'secondary'}>{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Track all system activities and changes
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs yet
            </div>
          ) : (
            <div className="divide-y">
              {logs.map(log => (
                <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {getActionBadge(log.action)}
                        <span className="text-sm font-medium">{log.entity}</span>
                        {log.entityId && (
                          <span className="text-xs text-muted-foreground">#{log.entityId.slice(0, 8)}</span>
                        )}
                      </div>
                      <p className="text-sm mb-1">
                        <span className="font-medium">{log.userName}</span>
                        <span className="text-muted-foreground"> performed </span>
                        <span className="font-medium">{log.action.toLowerCase().replace(/_/g, ' ')}</span>
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDateTime(log.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
