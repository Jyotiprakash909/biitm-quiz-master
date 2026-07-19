import React, { useEffect, useState } from 'react';
import { Typography, Paper, Grid, Box, TextField, Button, Alert, CircularProgress, Divider, IconButton } from '@mui/material';
import { Save as SaveIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    institutionName: '',
    institutionLogo: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    defaultPassPercentage: 40,
    defaultDurationMinutes: 60,
    pdfHeader: '',
    pdfFooter: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data) {
          setSettings(data);
        }
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Uploading logo...');
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const { data } = await api.post('/settings/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSettings(prev => ({ ...prev, institutionLogo: data.url }));
      toast.success('Logo uploaded successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to upload logo', { id: toastId });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  return (
    <Box maxWidth="900px" mx="auto">
      <Typography variant="h4" fontWeight="900" color="#0f172a" mb={1}>Platform Settings</Typography>
      <Typography variant="body2" color="#64748b" mb={4}>Manage global configurations, defaults, and branding for the examination platform.</Typography>

      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #e2e8f0', mb: 4 }}>
        
        {/* Branding & Institution */}
        <Typography variant="h6" fontWeight="800" color="#1e293b" mb={3}>Institution & Branding</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight="700" color="#475569" mb={1}>Institution Name</Typography>
            <TextField 
              fullWidth 
              size="small"
              name="institutionName"
              value={settings.institutionName || ''} 
              onChange={handleChange}
              placeholder="e.g. Oxford University"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight="700" color="#475569" mb={1}>Logo URL or Upload</Typography>
            <Box display="flex" gap={1}>
              <TextField 
                fullWidth 
                size="small"
                name="institutionLogo"
                value={settings.institutionLogo || ''} 
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Button
                variant="outlined"
                component="label"
                sx={{ minWidth: 'auto', p: 1, borderRadius: 2 }}
              >
                <UploadIcon />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </Button>
            </Box>
            {settings.institutionLogo && (
              <Box mt={1}>
                <img src={settings.institutionLogo} alt="Logo Preview" style={{ maxHeight: '40px', objectFit: 'contain' }} />
              </Box>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight="700" color="#475569" mb={1}>Primary Theme Color</Typography>
            <Box display="flex" gap={2}>
              <TextField 
                type="color"
                name="primaryColor"
                value={settings.primaryColor || '#3b82f6'} 
                onChange={handleChange}
                sx={{ width: 60, height: 40, p: 0, '& .MuiOutlinedInput-root': { borderRadius: 2, p: 0.5 } }}
              />
              <TextField 
                fullWidth 
                size="small"
                value={settings.primaryColor || '#3b82f6'} 
                disabled
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight="700" color="#475569" mb={1}>Secondary Theme Color</Typography>
            <Box display="flex" gap={2}>
              <TextField 
                type="color"
                name="secondaryColor"
                value={settings.secondaryColor || '#10b981'} 
                onChange={handleChange}
                sx={{ width: 60, height: 40, p: 0, '& .MuiOutlinedInput-root': { borderRadius: 2, p: 0.5 } }}
              />
              <TextField 
                fullWidth 
                size="small"
                value={settings.secondaryColor || '#10b981'} 
                disabled
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Exam Defaults */}
        <Typography variant="h6" fontWeight="800" color="#1e293b" mb={3}>Exam Defaults</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight="700" color="#475569" mb={1}>Default Duration (Minutes)</Typography>
            <TextField 
              fullWidth 
              size="small"
              type="number"
              name="defaultDurationMinutes"
              value={settings.defaultDurationMinutes || 60} 
              onChange={handleChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight="700" color="#475569" mb={1}>Default Pass Percentage (%)</Typography>
            <TextField 
              fullWidth 
              size="small"
              type="number"
              name="defaultPassPercentage"
              value={settings.defaultPassPercentage || 40} 
              onChange={handleChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* PDF Customization */}
        <Typography variant="h6" fontWeight="800" color="#1e293b" mb={3}>PDF Report Customization</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="700" color="#475569" mb={1}>Marksheet Header Text</Typography>
            <TextField 
              fullWidth 
              size="small"
              name="pdfHeader"
              value={settings.pdfHeader || ''} 
              onChange={handleChange}
              placeholder="e.g. OFFICIAL EXAM MARKSHEET"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="700" color="#475569" mb={1}>Marksheet Footer Text</Typography>
            <TextField 
              fullWidth 
              size="small"
              name="pdfFooter"
              value={settings.pdfFooter || ''} 
              onChange={handleChange}
              placeholder="e.g. Generated automatically by the portal"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>

        <Box mt={5} display="flex" justifyContent="flex-end">
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
