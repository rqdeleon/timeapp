"use client"

import React from 'react'

import { TableColumnProps, columns } from './columns'
import { DataTable } from '@/components/ui/table/data-table'


interface TableClientProps{
    data: TableColumnProps[],
}
export const LateReportClientPage: React.FC<TableClientProps> = ({
    data,
}) => {

  return (
    <>
			{/* <div className="flex items-center justify-between">
				<Button
					onClick={()=> router.push(`/dashboard/${params.companyId}/items/new`)}
				>
					<Plus className="mr-2 h-4 w-4"/>
					Add New
				</Button>
			</div> */}
				<DataTable 
					columns={columns} 
					data={data} 
					searchKey={{label:'Name', key:'employeeName'}} 
					// filter={{
					// 	column: 'department',
					// 	label: 'Department',
					// 	options:[formattedFilter]
					// }}
				/> 
    </>
  )
}
