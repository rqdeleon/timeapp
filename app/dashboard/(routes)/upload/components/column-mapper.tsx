'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface ColumnMapperProps {
  headers: string[];
  mapping: { [key: string]: string };
  onChange: (mapping: { [key: string]: string }) => void;
}

const REQUIRED_FIELDS = [
  { key: 'employeeId', label: 'Employee ID', required: true, description: 'Unique identifier for the employee' },
  { key: 'name', label: 'Employee Name', required: false, description: 'Full name of the employee' },
  { key: 'date', label: 'Date', required: true, description: 'Work date' },
  { key: 'timeIn', label: 'Time In', required: false, description: 'Check-in time' },
  { key: 'timeOut', label: 'Time Out', required: false, description: 'Check-out time' },
  { key: 'department', label: 'Department', required: false, description: 'Employee department' }
];

export default function ColumnMapper({ headers, mapping, onChange }: ColumnMapperProps) {
  const handleMappingChange = (field: string, header: string) => {
    const newMapping = { ...mapping };
    
    // Remove this header from other mappings
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === header && key !== field) {
        delete newMapping[key];
      }
    });
    
    if (header === 'none') {
      delete newMapping[field];
    } else {
      newMapping[field] = header;
    }
    
    onChange(newMapping);
  };

  const getUsedHeaders = () => {
    return new Set(Object.values(mapping));
  };

  const isFieldMapped = (field: string) => {
    return mapping[field] && headers.includes(mapping[field]);
  };

  const usedHeaders = getUsedHeaders();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Column Mapping Configuration
          <Badge variant={Object.keys(mapping).length >= 2 ? 'default' : 'secondary'}>
            {Object.keys(mapping).length} mapped
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {REQUIRED_FIELDS.map((field) => (
            <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.label}</span>
                  {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  {isFieldMapped(field.key) && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {field.required && !isFieldMapped(field.key) && <AlertCircle className="w-4 h-4 text-red-600" />}
                </div>
                <p className="text-sm text-gray-500">{field.description}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={mapping[field.key] || 'none'}
                  onValueChange={(value) => handleMappingChange(field.key, value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-gray-500">Not mapped</span>
                    </SelectItem>
                    {headers.map((header) => (
                      <SelectItem
                        key={header}
                        value={header}
                        disabled={usedHeaders.has(header) && mapping[field.key] !== header}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{header}</span>
                          {usedHeaders.has(header) && mapping[field.key] !== header && (
                            <Badge variant="outline" className="text-xs ml-2">Used</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {mapping[field.key] && (
                  <div className="flex items-center text-sm text-green-600">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Preview section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Mapping Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {REQUIRED_FIELDS.filter(field => mapping[field.key]).map((field) => (
              <div key={field.key} className="flex items-center gap-2">
                <span className="text-gray-600">{field.label}:</span>
                <Badge variant="outline">{mapping[field.key]}</Badge>
              </div>
            ))}
          </div>
          
          {Object.keys(mapping).length === 0 && (
            <p className="text-sm text-gray-500">No columns mapped yet</p>
          )}
        </div>

        {/* Validation summary */}
        <div className="mt-4 p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            {mapping.employeeId && mapping.date ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="space-y-1">
              <h5 className="font-medium">
                {mapping.employeeId && mapping.date ? 'Ready to Process' : 'Missing Required Fields'}
              </h5>
              <div className="text-sm text-gray-600">
                {!mapping.employeeId && <p>• Employee ID column is required</p>}
                {!mapping.date && <p>• Date column is required</p>}
                {mapping.employeeId && mapping.date && (
                  <p>All required fields are mapped. You can proceed with the upload.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}