import { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, Card, Statistic, Row, Col, App, Input } from 'antd';
import { FileTextOutlined, DownloadOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosInstance from '../../utils/axiosInstance';
import Button from '../Button';


const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  reportType: 'comprehensive' | 'customer' | 'financial';
  title: string;
}

interface Customer {
  id: string;
  name: string;
  type: string;
}

interface FilterData {
  customers: Customer[];
}

interface ReportSummary {
  total_services: number;
  unique_customers: number;
  total_revenue_cents: bigint;
  total_revenue_dollars: number;
  by_service_type: {
    [key: string]: {
      count: number;
      revenue_cents: bigint;
      revenue_dollars: number;
      average_value: number;
    };
  };
  by_status: {
    [key: string]: {
      count: number;
      revenue_cents: bigint;
      revenue_dollars: number;
    };
  };
}

export default function ReportModal({ open, onClose, reportType, title }: ReportModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filterData, setFilterData] = useState<FilterData>({ customers: [] });
  const [reportData, setReportData] = useState<any[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    if (open) {
      loadCustomers();
      // Set default date range to current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      form.setFieldsValue({
        dateRange: [dayjs(startOfMonth), dayjs(new Date())],
        service_type: 'all',
        group_by: 'customer',
        include_inactive: false
      });
    } else {
      setReportData([]);
      setSummary(null);
      setCustomerSearch('');
    }
  }, [open, reportType]);

  const loadCustomers = async (search?: string) => {
    try {
      const params: any = {};
      if (search) {
        params.search = search;
      }
      
      const res = await axiosInstance.get('/wo/reports/customers', { params });
      setFilterData({ customers: res.data.customers });
    } catch (err: any) {
      console.log('Failed to load customers:', err);
      setFilterData({ customers: [] });
    }
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value);
    loadCustomers(value);
  };

  const generateReport = async (values: any) => {
    setGenerating(true);
    try {
      const params: any = {};
      
      // Date range
      if (values.dateRange) {
        params.from = values.dateRange[0].format('YYYY-MM-DD');
        params.to = values.dateRange[1].format('YYYY-MM-DD');
      }

      // Customer filter
      if (values.customer_id) {
        params.customer_id = values.customer_id;
      }

      // Work order filters
      if (values.work_order_id) {
        params.work_order_id = values.work_order_id;
      }

      if (values.wo_number) {
        params.wo_number = values.wo_number;
      }

      // Status filter
      if (values.status && values.status !== 'all') {
        params.status = values.status;
      }

      // Service type
      if (values.service_type && values.service_type !== 'all') {
        params.service_type = values.service_type;
      }

      // Group by
      if (values.group_by) {
        params.group_by = values.group_by;
      }

      // Include inactive
      if (values.include_inactive) {
        params.include_inactive = values.include_inactive;
      }

      const endpoint = reportType === 'customer' && values.customer_id 
        ? `/wo/reports/customer/${values.customer_id}`
        : '/wo/reports/comprehensive';

      const res = await axiosInstance.get(endpoint, { params });
      
      if (reportType === 'customer') {
        setReportData(res.data.services || []);
        setSummary(res.data.summary);
      } else {
        setReportData(res.data.items || []);
        setSummary(res.data.summary);
      }
      
      message.success(`Report generated with ${reportData.length} records`);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to generate report');
      console.error('Report generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    if (!reportData.length) {
      message.warning('No data to export');
      return;
    }

    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = { export: format };
      
      if (values.dateRange) {
        params.from = values.dateRange[0].format('YYYY-MM-DD');
        params.to = values.dateRange[1].format('YYYY-MM-DD');
      }

      if (values.customer_id) {
        params.customer_id = values.customer_id;
      }

      if (values.status && values.status !== 'all') {
        params.status = values.status;
      }

      if (values.service_type && values.service_type !== 'all') {
        params.service_type = values.service_type;
      }

      const endpoint = reportType === 'customer' && values.customer_id 
        ? `/wo/reports/customer/${values.customer_id}`
        : '/wo/reports/comprehensive';

      // Trigger download
      const response = await axiosInstance.get(endpoint, {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `${reportType}-report-${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Report exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      message.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    // Reset to current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    form.setFieldsValue({
      dateRange: [dayjs(startOfMonth), dayjs(new Date())],
      service_type: 'all',
      group_by: 'customer',
      include_inactive: false,
      customer_id: undefined,
      status: undefined,
      work_order_id: undefined,
      wo_number: undefined
    });
    setReportData([]);
    setSummary(null);
    setCustomerSearch('');
  };

  const renderComprehensiveFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Form.Item 
        label="Date Range" 
        name="dateRange"
        rules={[{ required: true, message: 'Please select date range' }]}
      >
        <RangePicker className="w-full" format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item label="Customer" name="customer_id">
        <Select 
          placeholder="Select Customer" 
          allowClear
          showSearch
          optionFilterProp="children"
          suffixIcon={<UserOutlined />}
          filterOption={false}
          onSearch={handleCustomerSearch}
          searchValue={customerSearch}
        >
       {filterData.customers.map((customer: Customer) => (
  <Option key={customer.id} value={customer.id}>
    {customer.name} {customer.type ? `(${customer.type})` : ''}
  </Option>
))}
        </Select>
      </Form.Item>

      <Form.Item label="Service Type" name="service_type">
        <Select placeholder="All Services">
          <Option value="all">All Services</Option>
          <Option value="rim">Rim Services</Option>
          <Option value="mechanical">Mechanical Repairs</Option>
          <Option value="bodyshop">Bodyshop Services</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Status" name="status">
        <Select placeholder="All Status" allowClear>
          <Option value="pending">Pending</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="completed">Completed</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Work Order ID" name="work_order_id">
        <Input placeholder="Work Order ID" />
      </Form.Item>

      <Form.Item label="WO Number" name="wo_number">
        <Input placeholder="WO Number" />
      </Form.Item>

      <Form.Item label="Group By" name="group_by">
        <Select>
          <Option value="customer">Customer</Option>
          <Option value="service_type">Service Type</Option>
          <Option value="status">Status</Option>
          <Option value="date">Date</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Include Inactive" name="include_inactive" valuePropName="checked">
        <Select>
          <Option value={false}>No</Option>
          <Option value={true}>Yes</Option>
        </Select>
      </Form.Item>
    </div>
  );

  const renderCustomerFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Form.Item 
        label="Customer"
        name="customer_id"
        rules={[{ required: true, message: 'Please select a customer' }]}
      >
        <Select 
          placeholder="Select Customer" 
          showSearch
          optionFilterProp="children"
          suffixIcon={<UserOutlined />}
          filterOption={false}
          onSearch={handleCustomerSearch}
          searchValue={customerSearch}
        >
        {filterData.customers.map((customer: Customer) => (
  <Option key={customer.id} value={customer.id}>
    {customer.name} {customer.type ? `(${customer.type})` : ''}
  </Option>
))}
        </Select>
      </Form.Item>

      <Form.Item 
        label="Date Range" 
        name="dateRange"
      >
        <RangePicker className="w-full" format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item label="Service Type" name="service_type">
        <Select placeholder="All Services">
          <Option value="all">All Services</Option>
          <Option value="rim">Rim Services</Option>
          <Option value="mechanical">Mechanical Repairs</Option>
          <Option value="bodyshop">Bodyshop Services</Option>
        </Select>
      </Form.Item>
    </div>
  );

  const renderFinancialFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Form.Item 
        label="Date Range" 
        name="dateRange"
        rules={[{ required: true, message: 'Please select date range' }]}
      >
        <RangePicker className="w-full" format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item label="Group By" name="group_by">
        <Select>
          <Option value="day">Day</Option>
          <Option value="week">Week</Option>
          <Option value="month">Month</Option>
        </Select>
      </Form.Item>
    </div>
  );

  const renderSummary = () => {
    if (!summary) return null;

    return (
      <Card title="Summary" size="small">
        <Row gutter={16}>
          <Col span={4}>
            <Statistic title="Total Services" value={summary.total_services} />
          </Col>
          <Col span={4}>
            <Statistic title="Unique Customers" value={summary.unique_customers} />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Total Revenue" 
              value={summary.total_revenue_dollars} 
              precision={2}
              prefix="$"
            />
          </Col>
          
          {/* Service Type Breakdown */}
          {Object.entries(summary.by_service_type).map(([type, data]) => (
            <Col span={4} key={type}>
              <Statistic 
                title={`${type.charAt(0).toUpperCase() + type.slice(1)} Services`}
                value={data.count}
                suffix={
                  <div className="text-xs">
                    ${(data.revenue_dollars).toFixed(2)}
                  </div>
                }
              />
            </Col>
          ))}
        </Row>

        {/* Status Breakdown */}
        {Object.keys(summary.by_status).length > 0 && (
          <Row gutter={16} className="mt-4">
            <Col span={24}>
              <h4 className="mb-2">Status Breakdown:</h4>
            </Col>
            {Object.entries(summary.by_status).map(([status, data]) => (
              <Col span={3} key={status}>
                <Statistic 
                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                  value={data.count}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>
    );
  };

  const getColumnsForReport = (_reportType: string, type: ReportModalProps['reportType']) => {
    const baseColumns = [
      { key: 'customer_display_name', label: 'Customer' },
      { key: 'service_type', label: 'Service Type' },
      { key: 'wo_number', label: 'WO Number' },
      { key: 'status', label: 'Status' },
      { key: 'total_dollars', label: 'Amount', render: (val: any) => `$${Number(val || 0).toFixed(2)}` },
      { key: 'vehicle_model', label: 'Vehicle' },
      { key: 'vehicle_plate', label: 'Plate' },
      { key: 'services_count', label: 'Services Count' },
      { key: 'created_at', label: 'Created Date' }
    ];

    if (type === 'customer') {
      return [
        { key: 'service_type', label: 'Service Type' },
        { key: 'wo_number', label: 'WO Number' },
        { key: 'status', label: 'Status' },
        { key: 'total_dollars', label: 'Amount', render: (val: any) => `$${Number(val || 0).toFixed(2)}` },
        { key: 'vehicle_model', label: 'Vehicle' },
        { key: 'vehicle_plate', label: 'Plate' },
        { key: 'created_at', label: 'Created Date' }
      ];
    }

    return baseColumns;
  };

  const displayValue = (row: any, key: string, render?: (val: any) => string) => {
    const val = row[key];
    if (val === null || val === undefined || val === '' || val === '-' ) return '-';
    if (render) return render(val);
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (key === 'total_dollars') return `$${Number(val || 0).toFixed(2)}`;
    return String(val);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileTextOutlined />
          <span>{title} Report</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      footer={null}
      className="report-modal"
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <div className="space-y-4">
        {/* Filters */}
        <Card title="Filters" size="small">
          <Form
            form={form}
            layout="vertical"
            onFinish={generateReport}
            initialValues={{
              service_type: 'all',
              group_by: 'customer',
              include_inactive: false
            }}
          >
            {reportType === 'comprehensive' ? renderComprehensiveFilters() : 
             reportType === 'customer' ? renderCustomerFilters() : 
             renderFinancialFilters()}

            <div className="flex gap-2 justify-end mt-4">
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                Reset
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={generating}
                icon={<FileTextOutlined />}
              >
                Generate Report
              </Button>
            </div>
          </Form>
        </Card>

        {/* Summary */}
        {renderSummary()}

        {/* Actions */}
        {reportData.length > 0 && (
          <Card title="Export" size="small">
            <div className="flex gap-2">
              <Button 
                icon={<DownloadOutlined />}
                loading={loading}
                onClick={() => exportReport('csv')}
              >
                Export CSV
              </Button>
              <Button 
                icon={<DownloadOutlined />}
                loading={loading}
                onClick={() => exportReport('pdf')}
              >
                Export PDF
              </Button>
            </div>
          </Card>
        )}

        {/* Data Preview */}
        {reportData.length > 0 && (() => {
          const sample = reportData[0];
          const columns = getColumnsForReport(reportType, sample);
          
          return (
            <Card title={`Data Preview (${reportData.length} records)`} size="small">
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {columns.map(col => (
                        <th key={col.key} className="p-2 text-left border-b whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.slice(0, 15).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-gray-50">
                        {columns.map(col => (
                          <td key={col.key} className="p-2 truncate max-w-xs">
                            {displayValue(row, col.key, col.render)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.length > 15 && (
                  <div className="text-center p-2 text-gray-500">
                    ... and {reportData.length - 15} more records
                  </div>
                )}
              </div>
            </Card>
          );
        })()}
      </div>
    </Modal>
  );
}