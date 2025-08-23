"use client"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingDown, TrendingUp, BookmarkCheck } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  Icon?: React.ReactElement;
  trend?: string;
  trendValue?: string;
  className?: string;
}
const StatCard = ({ title, value, Icon, trend, trendValue, className }:Props) => (
  <Card className={`${className}`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {trend && (
            <div className="flex items-center space-x-1">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trendValue}

              </span>
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          { Icon ? Icon : <BookmarkCheck className='h-4 w-4 text-muted-foreground' /> }
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StatCard;