import { useState } from "react";
import { Card, App, Upload, type UploadFile, Row, Col, Avatar, Tabs, Tag, Skeleton } from "antd";
import { InboxOutlined, EditOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useNavigate } from "react-router-dom";

const { Dragger } = Upload;

export default function AddClient() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  
  const [formData, setFormData] = useState({
    clientName: "",
    citizenCardNumber: "",
    companyId: "",
    phoneNumber: "",
    email: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    taxNumber: "",
    registrationDate: "",
    status: "Active",
  });
  
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(true); // Always in edit mode for Add Client
  const [activeKey, setActiveKey] = useState("details");

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    onChange(info) {
      setFileList(info.fileList);
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving client:', { ...formData, documents: fileList });
      message.success('Client added successfully!');
      navigate('/clients');
    } catch (error) {
      message.error('Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  const statusTag = (
    <Tag color="green" className="!m-0">
      ACTIVE
    </Tag>
  );

  const tabItems = [
    {
      key: "details",
      label: "Details",
      children: (
        <div className="space-y-8">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-ink mb-6 pb-2 border-b border-gray-200">
              Personal Information
            </h2>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Client Name *
                  </label>
                  <Input
                    placeholder="Enter client name"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Citizen Card Number *
                  </label>
                  <Input
                    placeholder="Enter citizen card number"
                    value={formData.citizenCardNumber}
                    onChange={(e) => handleInputChange('citizenCardNumber', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Phone Number *
                  </label>
                  <Input
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Email Address *
                  </label>
                  <Input
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    size="large"
                    type="email"
                  />
                </div>
              </Col>
            </Row>
          </div>

          {/* Company Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-ink mb-6 pb-2 border-b border-gray-200">
              Company Information
            </h2>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Company ID *
                  </label>
                  <Input
                    placeholder="Enter company ID"
                    value={formData.companyId}
                    onChange={(e) => handleInputChange('companyId', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Tax Number
                  </label>
                  <Input
                    placeholder="Enter tax number"
                    value={formData.taxNumber}
                    onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Registration Date
                  </label>
                  <Input
                    placeholder="YYYY-MM-DD"
                    value={formData.registrationDate}
                    onChange={(e) => handleInputChange('registrationDate', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Status
                  </label>
                  <Input
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    size="large"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </Col>
            </Row>
          </div>

          {/* Address Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-ink mb-6 pb-2 border-b border-gray-200">
              Address Information
            </h2>
            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Address
                  </label>
                  <Input
                    placeholder="Enter street address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    City
                  </label>
                  <Input
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Country
                  </label>
                  <Input
                    placeholder="Enter country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Postal Code
                  </label>
                  <Input
                    placeholder="Enter postal code"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    size="large"
                  />
                </div>
              </Col>
            </Row>
          </div>
        </div>
      ),
    },
    {
      key: "documents",
      label: "Documents",
      children: (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-ink mb-6 pb-2 border-b border-gray-200">
              Client Documents
            </h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">
                Upload supporting documents
              </label>
              <Dragger {...uploadProps} className="!rounded-xl">
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.
                </p>
              </Dragger>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header - Matching Employee Profile Style */}
      <div className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar size={64} className="bg-blue-500">
              {formData.clientName ? formData.clientName[0]?.toUpperCase() : "C"}
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-title uppercase text-ink truncate">
                  {formData.clientName || "New Client"}
                </h1>
                {statusTag}
              </div>
              <div className="text-gray-500 text-sm truncate">
                {formData.companyId ? `Company ID: ${formData.companyId}` : "Add company information"}
              </div>
              <div className="text-gray-400 text-xs">
                {formData.registrationDate ? `Registered: ${formData.registrationDate}` : "New registration"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSave}
            >
              Save Client
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs - Matching Employee Profile Style */}
      <Card className="!rounded-2xl !shadow !border-0">
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
        />
      </Card>
    </div>
  );
}