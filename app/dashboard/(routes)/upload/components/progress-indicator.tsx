// components/ui/progress-indicator.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, FileText, CheckCircle } from 'lucide-react';

interface ProcessingProgress {
  stage: 'validation' | 'employee_processing' | 'attendance_processing' | 'completed';
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processed: number;
  total: number;
}

interface ProgressIndicatorProps {
  progress: ProcessingProgress;
}

const STAGE_INFO = {
  validation: { label: 'Validating Data', icon: FileText, color: 'blue' },
  employee_processing: { label: 'Processing Employees', icon: Users, color: 'purple' },
  attendance_processing: { label: 'Processing Attendance', icon: Clock, color: 'orange' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'green' }
};

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const stageInfo = STAGE_INFO[progress.stage];
  const Icon = stageInfo.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`w-5 h-5 text-${stageInfo.color}-600`} />
          {stageInfo.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <Progress value={progress.progress} className="h-3" />
        </div>

        {/* Stage-specific Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">
              {progress.processed}
            </div>
            <div className="text-xs text-blue-800">Records Processed</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-600">
              {progress.total - progress.processed}
            </div>
            <div className="text-xs text-purple-800">Remaining</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-semibold text-orange-600">
              {progress.currentBatch}/{progress.totalBatches}
            </div>
            <div className="text-xs text-orange-800">Batch Progress</div>
          </div>
        </div>

        {/* Batch Progress */}
        {progress.totalBatches > 1 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Current Batch</span>
              <span>
                {progress.currentBatch} of {progress.totalBatches}
              </span>
            </div>
            <Progress 
              value={(progress.currentBatch / progress.totalBatches) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Stage Status */}
        <div className="flex items-center justify-center gap-2">
          <Badge 
            variant="outline" 
            className={`text-${stageInfo.color}-700 border-${stageInfo.color}-300`}
          >
            {stageInfo.label}
          </Badge>
          
          {progress.stage !== 'completed' && (
            <div className="flex items-center space-x-1">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-500">Processing...</span>
            </div>
          )}
        </div>

        {/* Estimated Time */}
        {progress.stage !== 'completed' && progress.processed > 0 && (
          <div className="text-center text-sm text-gray-500">
            <Clock className="w-4 h-4 inline mr-1" />
            Processing {progress.total} total records...
          </div>
        )}
      </CardContent>
    </Card>
  );
}