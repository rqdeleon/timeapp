"use client"

import React from 'react'
import { Plus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { TableColumnProps, columns } from './columns'
import { DataTable } from '@/components/ui/table/data-table'



interface TablelientProps{
    data: TableColumnProps[],
}
export const EmployeeScheduleHistoryClient: React.FC<TablelientProps> = ({
    data,
}) => {
    const router = useRouter()
    const params = useParams()
		const formattedFilter = {
			value: "operations",
			label: "operations",
		}

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
