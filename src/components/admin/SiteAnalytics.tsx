import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ExternalLink, Eye, Users, MousePointerClick } from "lucide-react";

const LOVABLE_ANALYTICS_URL =
  "https://lovable.dev/projects/19723d1a-6050-4b5d-b0ab-cd80f4c79610/settings/project-insights";

export const SiteAnalytics = () => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Site Analytics</CardTitle>
          </div>
          <Button asChild size="sm" variant="outline">
            <a
              href={LOVABLE_ANALYTICS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Open full analytics
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Production traffic for <span className="font-medium text-foreground">nadaclookup.com</span>{" "}
          is tracked automatically. View pageviews, unique visitors, top pages, traffic sources,
          devices, and countries in the full analytics dashboard.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              Pageviews
            </div>
            <p className="text-xs text-muted-foreground">Total views over any date range</p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Unique Visitors
            </div>
            <p className="text-xs text-muted-foreground">Distinct users by day, week, or month</p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <MousePointerClick className="h-4 w-4" />
              Top Pages & Sources
            </div>
            <p className="text-xs text-muted-foreground">See which pages and referrers drive traffic</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
