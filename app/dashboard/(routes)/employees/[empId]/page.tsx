// app/dashboard/employees/[id]/page.tsx - Employee Detail View

import { EmployeeDetailView } from '../components/detail-view'
import { getEmployeeById } from '@/lib/services/employee-services'

const EmployeeDetailPage = async ({
  params
}: {
  params: {empId : string}
}) => {
      
  const employeeData = await getEmployeeById(params.empId);        
  if (!employeeData) {
    return (       
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load employees
          </h3>
          <p className="text-gray-500 mb-4">Fetching Data Error</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return <EmployeeDetailView employee={employeeData} />
}

export default EmployeeDetailPage;