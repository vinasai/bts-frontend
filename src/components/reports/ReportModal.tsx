// src/components/ReportModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, Card, Statistic, Row, Col, App, Switch } from 'antd';
import { FileTextOutlined, DownloadOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosInstance from '../../utils/axiosInstance';
import Button from '../Button';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  reportType: 'wfh' | 'attendance' | 'leave';  // Add leave
  title: string;
}

interface FilterData {
  staff: Array<{
    id: string;
    name: string;
    position: string;
    employee_id?: string;
  }>;
  positions: string[];
}

interface ReportSummary {
  with_checkout: number;
  with_checkin: number;
  total: number;
  approved?: number;
  rejected?: number;
  pending?: number;
  total_records?: number;
  present_staff?: number;
  absent_staff?: number;
  completed_shifts?: number;
  with_overtime?: number;
  forced_outs?: number;
  total_worked_hours?: number;
  total_overtime_hours?: number;
  total_net_hours?: number;
  total_unproductive_hours?: number;
  // Leave specific
  total_requests?: number;
  total_days?: number;
  upcoming_leaves?: number;
  current_leaves?: number;
  past_leaves?: number;
  average_duration?: number;
}

export default function ReportModal({ open, onClose, reportType, title }: ReportModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filterData, setFilterData] = useState<FilterData>({ staff: [], positions: [] });
  const [reportData, setReportData] = useState<any[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  useEffect(() => {
    if (open) {
      loadFilterData();
      // Set default date range to current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      form.setFieldsValue({
        dateRange: [dayjs(startOfMonth), dayjs(new Date())]
      });
    }
  }, [open]);

  const loadFilterData = async () => {
    try {
      const res = await axiosInstance.get('/reports/filters');
      setFilterData(res.data);
    } catch (err: any) {
      console.log('Filter data not available, continuing without filters');
      setFilterData({ staff: [], positions: [] });
    }
  };

  const generateReport = async (values: any) => {
    setGenerating(true);
    try {
      const params: any = {};
      
      // Date range
      if (values.dateRange) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD');
        params.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }

      // Status filter
      if (values.status && values.status !== 'all') {
        params.status = values.status;
      }

      // Staff filter
      if (values.staffId) {
        params.staffId = values.staffId;
      }

      // Position filter (for leave)
      if (reportType === 'leave' && values.position && values.position !== 'all') {
        params.position = values.position;
      }

      // Additional attendance filters
      if (reportType === 'attendance') {
        if (values.showOvertime) {
          params.showOvertime = 'true';
        }
        if (values.showUnproductive) {
          params.showUnproductive = 'true';
        }
      }

      const res = await axiosInstance.get(`/reports/${reportType}`, { params });
      setReportData(res.data.data);
      setSummary(res.data.summary);
      
      message.success(`Report generated with ${res.data.data.length} records`);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to generate report');
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
        params.startDate = values.dateRange[0].format('YYYY-MM-DD');
        params.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }

      if (values.status && values.status !== 'all') {
        params.status = values.status;
      }

      if (values.staffId) {
        params.staffId = values.staffId;
      }

      if (reportType === 'leave' && values.position && values.position !== 'all') {
        params.position = values.position;
      }

      if (reportType === 'attendance' && values.showOvertime) {
        params.showOvertime = 'true';
      }

      // Trigger download
      const response = await axiosInstance.get(`/reports/${reportType}`, {
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
      status: 'all',
      staffId: undefined,
      position: 'all',
      showOvertime: false,
      showUnproductive: false
    });
    setReportData([]);
    setSummary(null);
  };

  const renderWFHFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Form.Item 
        label="Date Range" 
        name="dateRange"
        rules={[{ required: true, message: 'Please select date range' }]}
      >
        <RangePicker className="w-full" format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item label="Status" name="status">
        <Select placeholder="All Status">
          <Option value="all">All Status</Option>
          <Option value="pending">Pending</Option>
          <Option value="approved">Approved</Option>
          <Option value="rejected">Rejected</Option>
        </Select>
      </Form.Item>
    </div>
  );

  const renderAttendanceFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Form.Item 
        label="Date Range" 
        name="dateRange"
        rules={[{ required: true, message: 'Please select date range' }]}
      >
        <RangePicker className="w-full" format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item label="Staff" name="staffId">
        <Select 
          placeholder="Select Staff" 
          allowClear
          showSearch
          optionFilterProp="children"
          suffixIcon={<UserOutlined />}
        >
          {filterData.staff.map(staff => (
            <Option key={staff.id} value={staff.id}>
              {staff.name} ({staff.position})
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Status" name="status">
        <Select placeholder="All Status">
          <Option value="all">All Status</Option>
          <Option value="present">Present Only</Option>
          <Option value="absent">Absent Only</Option>
          <Option value="completed">Completed Shifts</Option>
          <Option value="incomplete">Incomplete Shifts</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Show Overtime Only" name="showOvertime" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item label="Include Unproductive Time" name="showUnproductive" valuePropName="checked">
        <Switch />
      </Form.Item>
    </div>
  );

  const renderLeaveFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Form.Item 
        label="Date Range" 
        name="dateRange"
        rules={[{ required: true, message: 'Please select date range' }]}
      >
        <RangePicker className="w-full" format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item label="Staff" name="staffId">
        <Select 
          placeholder="Select Staff" 
          allowClear
          showSearch
          optionFilterProp="children"
          suffixIcon={<UserOutlined />}
        >
          {filterData.staff.map(staff => (
            <Option key={staff.id} value={staff.id}>
              {staff.name} {staff.employee_id ? `(${staff.employee_id})` : ''}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Position" name="position">
        <Select placeholder="All Positions">
          <Option value="all">All Positions</Option>
          {filterData.positions.map(position => (
            <Option key={position} value={position}>{position}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Status" name="status">
        <Select placeholder="All Status">
          <Option value="all">All Status</Option>
          <Option value="pending">Pending</Option>
          <Option value="approved">Approved</Option>
          <Option value="rejected">Rejected</Option>
        </Select>
      </Form.Item>
    </div>
  );

  const renderSummary = () => {
    if (!summary) return null;

    return (
      <Card title="Summary" size="small">
        <Row gutter={16}>
          {reportType === 'wfh' ? (
            <>
              <Col span={4}>
                <Statistic title="Total Requests" value={summary.total} />
              </Col>
              <Col span={4}>
                <Statistic title="Approved" value={summary.approved || 0} />
              </Col>
              <Col span={4}>
                <Statistic title="Rejected" value={summary.rejected || 0} />
              </Col>
              <Col span={4}>
                <Statistic title="Pending" value={summary.pending || 0} />
              </Col>
              <Col span={4}>
                <Statistic title="With Check-in" value={summary.with_checkin || 0} />
              </Col>
              <Col span={4}>
                <Statistic title="With Check-out" value={summary.with_checkout || 0} />
              </Col>
            </>
          ) : reportType === 'attendance' ? (
            <>
              <Col span={4}>
                <Statistic title="Total Records" value={summary.total_records || 0} />
              </Col>
              <Col span={4}>
                <Statistic title="Present Staff" value={summary.present_staff || 0} />
              </Col>
              <Col span={4}>
                <Statistic title="Absent Staff" value={summary.absent_staff || 0} />
              </Col>
              <Col span={4}>
                <Statistic title="With Overtime" value={summary.with_overtime || 0} />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="Total Hours" 
                  value={summary.total_worked_hours || 0} 
                  precision={2}
                  suffix="hrs"
                />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="OT Hours" 
                  value={summary.total_overtime_hours || 0} 
                  precision={2}
                  suffix="hrs"
                />
              </Col>
            </>
          ) : (
            // Leave summary
            <>
              <Col span={3}>
                <Statistic title="Total Requests" value={summary.total_requests || 0} />
              </Col>
              <Col span={3}>
                <Statistic title="Pending" value={summary.pending || 0} />
              </Col>
              <Col span={3}>
                <Statistic title="Approved" value={summary.approved || 0} />
              </Col>
              <Col span={3}>
                <Statistic title="Rejected" value={summary.rejected || 0} />
              </Col>
              <Col span={3}>
                <Statistic title="Total Days" value={summary.total_days || 0} />
              </Col>
              <Col span={3}>
                <Statistic title="Upcoming" value={summary.upcoming_leaves || 0} />
              </Col>
              <Col span={3}>
                <Statistic title="Current" value={summary.current_leaves || 0} />
              </Col>
              <Col span={3}>
                <Statistic 
                  title="Avg Days" 
                  value={summary.average_duration || 0} 
                  precision={1}
                />
              </Col>
            </>
          )}
        </Row>
      </Card>
    );
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
      width={reportType === 'leave' ? 1000 : 800}
      footer={null}
      className="report-modal"
    >
      <div className="space-y-4">
        {/* Filters */}
        <Card title="Filters" size="small">
          <Form
            form={form}
            layout="vertical"
            onFinish={generateReport}
            initialValues={{
              status: 'all',
              position: 'all',
              showOvertime: false,
              showUnproductive: false
            }}
          >
            {reportType === 'wfh' ? renderWFHFilters() : 
             reportType === 'attendance' ? renderAttendanceFilters() : 
             renderLeaveFilters()}

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
        {reportData.length > 0 && (
          <Card title={`Data Preview (${reportData.length} records)`} size="small">
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(reportData[0]).slice(0, 8).map(key => (
                      <th key={key} className="p-2 text-left border-b whitespace-nowrap">
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.slice(0, 15).map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      {Object.keys(row).slice(0, 8).map(key => (
                        <td key={key} className="p-2 truncate max-w-xs">
                          {String(row[key] || '-')}
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
        )}
      </div>
    </Modal>
  );
}