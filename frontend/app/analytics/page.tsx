"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Eye,
  MousePointerClick,
  TrendingUp,
  Globe,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

import { API_URL } from "@/lib/config";

interface AnalyticsSummary {
  total_widget_loads: number;
  total_video_loads: number;
  total_video_clicks: number;
  conversion_rate: number;
  unique_domains: number;
  events: Array<{
    event: string;
    domain: string;
    timestamp: string;
  }>;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/api/analytics/summary?days=${days}`
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='animate-pulse space-y-4'>
            <div className='h-12 bg-gray-200 rounded w-1/3'></div>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='h-32 bg-gray-200 rounded'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <Card className='border-red-200 bg-red-50'>
            <CardHeader>
              <CardTitle className='text-red-600'>
                Error Loading Analytics
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchAnalytics}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const videoLoadRate = summary
    ? summary.total_widget_loads > 0
      ? (
          (summary.total_video_loads / summary.total_widget_loads) *
          100
        ).toFixed(1)
      : "0.0"
    : "0.0";

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8'>
      <div className='max-w-7xl mx-auto space-y-8'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-4xl font-bold text-gray-900'>
              Widget Analytics
            </h1>
            <p className='text-gray-600 mt-2'>
              Monitor your widget performance and engagement
            </p>
          </div>
          <div className='flex gap-2 items-center'>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className='border border-gray-300 rounded-lg px-4 py-2 bg-white'
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Button onClick={fetchAnalytics} variant='outline' size='sm'>
              <RefreshCw className='w-4 h-4 mr-2' />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {/* Widget Loads */}
          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>
                Widget Loads
              </CardTitle>
              <Activity className='w-5 h-5 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-gray-900'>
                {summary?.total_widget_loads.toLocaleString() || 0}
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                Total widget impressions
              </p>
            </CardContent>
          </Card>

          {/* Video Loads */}
          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>
                Video Loads
              </CardTitle>
              <Eye className='w-5 h-5 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-gray-900'>
                {summary?.total_video_loads.toLocaleString() || 0}
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                {videoLoadRate}% load success rate
              </p>
            </CardContent>
          </Card>

          {/* Video Clicks */}
          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>
                Video Clicks
              </CardTitle>
              <MousePointerClick className='w-5 h-5 text-purple-500' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-gray-900'>
                {summary?.total_video_clicks.toLocaleString() || 0}
              </div>
              <p className='text-xs text-gray-500 mt-2'>User interactions</p>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>
                Conversion Rate
              </CardTitle>
              <TrendingUp className='w-5 h-5 text-orange-500' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-gray-900'>
                {summary?.conversion_rate.toFixed(1) || 0}%
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                Clicks per widget load
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Unique Domains */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Globe className='w-5 h-5 text-blue-500' />
                <CardTitle>Domain Reach</CardTitle>
              </div>
              <CardDescription>
                Number of unique domains using the widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-4xl font-bold text-gray-900'>
                {summary?.unique_domains || 0}
              </div>
              <p className='text-sm text-gray-500 mt-2'>
                Active domains in the last {days} days
              </p>
            </CardContent>
          </Card>

          {/* Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                User journey through widget interaction
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Widget Loads</span>
                  <Badge variant='secondary'>
                    {summary?.total_widget_loads || 0}
                  </Badge>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-3'>
                  <div
                    className='bg-blue-500 h-3 rounded-full'
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Video Loads</span>
                  <Badge variant='secondary'>
                    {summary?.total_video_loads || 0}
                  </Badge>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-3'>
                  <div
                    className='bg-green-500 h-3 rounded-full'
                    style={{
                      width: `${
                        summary && summary.total_widget_loads > 0
                          ? (summary.total_video_loads /
                              summary.total_widget_loads) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Video Clicks</span>
                  <Badge variant='secondary'>
                    {summary?.total_video_clicks || 0}
                  </Badge>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-3'>
                  <div
                    className='bg-purple-500 h-3 rounded-full'
                    style={{
                      width: `${
                        summary && summary.total_widget_loads > 0
                          ? (summary.total_video_clicks /
                              summary.total_widget_loads) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest 20 widget interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {summary?.events.slice(0, 20).map((event, idx) => (
                <div
                  key={idx}
                  className='flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    {event.event === "widget_loaded" && (
                      <Activity className='w-4 h-4 text-blue-500' />
                    )}
                    {event.event === "video_loaded" && (
                      <Eye className='w-4 h-4 text-green-500' />
                    )}
                    {event.event === "video_clicked" && (
                      <MousePointerClick className='w-4 h-4 text-purple-500' />
                    )}
                    <div>
                      <p className='font-medium text-sm'>
                        {event.event
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </p>
                      <p className='text-xs text-gray-500'>{event.domain}</p>
                    </div>
                  </div>
                  <div className='text-xs text-gray-400'>
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              )) || (
                <div className='text-center py-8 text-gray-500'>
                  No events recorded yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back to Stores */}
        <div className='text-center'>
          <Button asChild variant='outline'>
            <Link href='/'>← Back to Stores</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
