'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Users, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { chatAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChatStats {
  totalMessages: number;
  totalUsers: number;
  activeUsers: number;
  averageMessagesPerUser: number;
  topChannels: Array<{
    id: string;
    name: string;
    messageCount: number;
    userCount: number;
  }>;
  messagesByHour: Array<{
    hour: number;
    count: number;
  }>;
  moderationActions: Array<{
    type: string;
    count: number;
    color: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'message' | 'join' | 'leave' | 'moderation';
    user: string;
    channel: string;
    timestamp: string;
    details?: string;
  }>;
}

export default function ChatStatsPage() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const normalizeChannelData = (channel: any) => {
    return {
      id: String(channel.id ?? channel.channel_id ?? Math.random().toString(36).substr(2, 9)),
      name: channel.name ?? channel.channel_name ?? channel.title ?? `Channel ${channel.id}`,
      messageCount: Number(channel.message_count ?? channel.messages ?? channel.total_messages ?? 0),
      userCount: Number(channel.user_count ?? channel.users ?? channel.participants ?? 0)
    }
  }

  const normalizeActivity = (activity: any) => {
    return {
      id: String(activity.id ?? Math.random().toString(36).substr(2, 9)),
      type: normalizeActivityType(activity.type ?? activity.activity_type),
      user: activity.user ?? activity.username ?? activity.user_name ?? 'Unknown',
      channel: activity.channel ?? activity.channel_name ?? activity.room ?? 'Unknown',
      timestamp: activity.timestamp ?? activity.created_at ?? activity.time ?? 'Unknown',
      details: activity.details ?? activity.description ?? activity.message ?? undefined
    }
  }

  const normalizeActivityType = (type: any): 'message' | 'join' | 'leave' | 'moderation' => {
    const typeStr = String(type).toLowerCase()
    if (typeStr.includes('moderation') || typeStr.includes('mod') || typeStr.includes('ban') || typeStr.includes('warn')) return 'moderation'
    if (typeStr.includes('join') || typeStr.includes('enter')) return 'join'
    if (typeStr.includes('leave') || typeStr.includes('exit')) return 'leave'
    return 'message'
  }

  useEffect(() => {
    fetchChatStats();
  }, [timeframe, selectedChannel]);

  const fetchChatStats = async () => {
    setLoading(true);
    try {
      // Fetch chat statistics from multiple API endpoints
      const [messagesResponse, usersResponse, moderationResponse] = await Promise.allSettled([
        chatAPI.getPartyMessages({ timeframe, channel: selectedChannel !== 'all' ? selectedChannel : undefined }),
        chatAPI.getActiveUsers({ timeframe }),
        chatAPI.getModerationStats ? chatAPI.getModerationStats({ timeframe }) : Promise.resolve(null)
      ])

      let chatStats: ChatStats = {
        totalMessages: 0,
        totalUsers: 0,
        activeUsers: 0,
        averageMessagesPerUser: 0,
        topChannels: [],
        messagesByHour: [],
        moderationActions: [],
        recentActivity: []
      }

      // Process messages data
      if (messagesResponse.status === 'fulfilled' && messagesResponse.value) {
        const messagesData = messagesResponse.value
        chatStats.totalMessages = Number(messagesData.total_count ?? messagesData.total_messages ?? 0)
        
        // Process hourly message data
        if (Array.isArray(messagesData.hourly_stats)) {
          chatStats.messagesByHour = messagesData.hourly_stats.map((stat: any) => ({
            hour: Number(stat.hour ?? stat.time ?? 0),
            count: Number(stat.count ?? stat.messages ?? 0)
          }))
        } else {
          // Generate empty hourly data if not available
          chatStats.messagesByHour = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: 0
          }))
        }

        // Process channel data
        if (Array.isArray(messagesData.channels) || Array.isArray(messagesData.top_channels)) {
          const channels = messagesData.channels || messagesData.top_channels || []
          chatStats.topChannels = channels.map(normalizeChannelData).slice(0, 10)
        }

        // Process recent activity
        if (Array.isArray(messagesData.recent_activity)) {
          chatStats.recentActivity = messagesData.recent_activity.map(normalizeActivity).slice(0, 20)
        }
      }

      // Process users data
      if (usersResponse.status === 'fulfilled' && usersResponse.value) {
        const usersData = usersResponse.value
        chatStats.totalUsers = Number(usersData.total_users ?? usersData.total ?? 0)
        chatStats.activeUsers = Number(usersData.active_users ?? usersData.active ?? 0)
        
        if (chatStats.totalMessages > 0 && chatStats.totalUsers > 0) {
          chatStats.averageMessagesPerUser = Number((chatStats.totalMessages / chatStats.totalUsers).toFixed(1))
        }
      }

      // Process moderation data
      if (moderationResponse.status === 'fulfilled' && moderationResponse.value) {
        const moderationData = moderationResponse.value
        if (Array.isArray(moderationData.actions)) {
          chatStats.moderationActions = moderationData.actions.map((action: any) => ({
            type: action.type ?? action.action_type ?? 'Unknown',
            count: Number(action.count ?? action.total ?? 0),
            color: getActionColor(action.type)
          }))
        } else if (moderationData.deleted_messages || moderationData.warnings || moderationData.bans) {
          // Fallback for different response format
          chatStats.moderationActions = [
            { type: 'Messages Deleted', count: Number(moderationData.deleted_messages ?? 0), color: '#ef4444' },
            { type: 'Users Warned', count: Number(moderationData.warnings ?? moderationData.warns ?? 0), color: '#f59e0b' },
            { type: 'Users Muted', count: Number(moderationData.mutes ?? moderationData.muted ?? 0), color: '#8b5cf6' },
            { type: 'Users Banned', count: Number(moderationData.bans ?? moderationData.banned ?? 0), color: '#dc2626' },
          ].filter(action => action.count > 0)
        }
      }

      setStats(chatStats);
    } catch (error) {
      console.error('Failed to fetch chat stats:', error);
      toast({
        title: 'Chat Statistics Unavailable',
        description: 'Unable to load chat statistics. Please try again later.',
        variant: 'destructive'
      })
      setStats(null)
    } finally {
      setLoading(false);
    }
  }

  const getActionColor = (actionType: string): string => {
    const type = String(actionType).toLowerCase()
    if (type.includes('delete') || type.includes('remove')) return '#ef4444'
    if (type.includes('warn') || type.includes('warning')) return '#f59e0b'
    if (type.includes('mute') || type.includes('silence')) return '#8b5cf6'
    if (type.includes('ban') || type.includes('block')) return '#dc2626'
    return '#6b7280'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load chat statistics</h2>
          <Button onClick={fetchChatStats}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat Statistics</h1>
          <p className="text-muted-foreground">Monitor chat activity and moderation metrics</p>
        </div>
        <div className="flex gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {stats.topChannels.map(channel => (
                <SelectItem key={channel.id} value={channel.id}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Messages/User</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageMessagesPerUser}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">+2.1</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderation Actions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.moderationActions.reduce((sum, action) => sum + action.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+8</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity">Activity Patterns</TabsTrigger>
          <TabsTrigger value="channels">Channel Stats</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.messagesByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Channels by Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topChannels.map((channel, index) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <h3 className="font-medium">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {channel.userCount} users active
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{channel.messageCount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">messages</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.moderationActions}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {stats.moderationActions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moderation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.moderationActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: action.color }}
                        />
                        <span>{action.type}</span>
                      </div>
                      <Badge variant="secondary">{action.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Input
                  placeholder="Search activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity
                  .filter(activity => 
                    activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    activity.channel.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={
                            activity.type === 'moderation' ? 'destructive' :
                            activity.type === 'join' ? 'secondary' :
                            activity.type === 'leave' ? 'outline' : 'default'
                          }
                        >
                          {activity.type}
                        </Badge>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{activity.user}</span>
                            <span className="text-muted-foreground">in</span>
                            <span className="font-medium">{activity.channel}</span>
                          </div>
                          {activity.details && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{activity.timestamp}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
